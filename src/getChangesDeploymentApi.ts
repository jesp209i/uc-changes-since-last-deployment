import {HttpClient, MediaTypes, Headers } from '@actions/http-client';
import { info } from '@actions/core';
import { OutgoingHttpHeaders } from 'http';
import { createWriteStream } from 'fs';

export interface DeploymentsResponse{
    "projectAlias": string,
    "deployments": Array<DeploymentStatus>
}

export interface DeploymentStatus {
    "deploymentId": string,
    "projectAlias": string,
    "deploymentState": string,
    "updateMessage": string,
    "errorMessage": string,
    "created": string,
    "lastModified": string,
    "completed": string
}

function generateHeaders(apiKey:string) : OutgoingHttpHeaders
{
    return {
        [Headers.ContentType]: MediaTypes.ApplicationJson,
        "Umbraco-Api-Key": apiKey
    };
}

export async function getLatestDeployment(baseUrl: string, apiKey: string): Promise<string>
{
    const generatedUrl = `${baseUrl}?skip=0&take=1`;

    const headers = generateHeaders(apiKey);

    const client = new HttpClient();
    var response = await client.getJson<DeploymentsResponse>(generatedUrl, headers);
    
    if (response.statusCode === 200 && response.result !== null)
    {
        return Promise.resolve(response.result.deployments[0].deploymentId);
    }

    return Promise.reject(`getLatestDeploymentFromApi: Unexpected response coming from server. ${response.statusCode} - ${JSON.stringify(response.result)} `);
}

export async function getDiff(baseUrl: string, apiKey: string, latestdeploymentId: string, downloadFolder: string) : Promise<void>
{
    return await new Promise(async (resolve, reject) => {

        const generatedUrl = `${baseUrl}/${latestdeploymentId}/diff`;

        const headers = generateHeaders(apiKey);

        const client = new HttpClient();

        const response = await client.get(generatedUrl, headers);

        info(`${response.message.statusCode}`);

        if (response.message.statusCode === 204) {

            return resolve();
        }

        if (response.message.statusCode === 200){
            const file = createWriteStream(downloadFolder);
            response.message.pipe(file);
            response.message.on('error', (error)=> reject(error));
            file.on('error', (error) => Promise.reject(error));
            file.on('finish', () => {
                info('finished reading stream');
                file.close(() => resolve());
            });
        }
        else 
        {
            //info(`${response.message.statusCode}`);
            return reject(`getDiff: Unexpected response coming from server. ${response.message.statusCode} - ${JSON.stringify(response.readBody())} `);
        }
    });
}