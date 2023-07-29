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

export async function getLatestDeploymentFromApi(baseUrl: string, apiKey: string): Promise<string>
{
    const generatedUrl = `${baseUrl}?skip=0&take=1`;

    info(generatedUrl);

    const headers = generateHeaders(apiKey);

    const client = new HttpClient();
    var response = await client.getJson<DeploymentsResponse>(generatedUrl, headers);
    info(`${response.statusCode} - ${JSON.stringify(response.result)}`);
    if (response.statusCode === 200 && response.result !== null)
    {
        return Promise.resolve(response.result.deployments[0].deploymentId);
    }

    return Promise.reject(`getLatestDeploymentFromApi: Unexpected response coming from server. ${response.statusCode} - ${JSON.stringify(response.result)} `);
}

export async function getChanges(baseUrl: string, apiKey: string, latestdeploymentId: string, downloadFolder: string) : Promise<void>
{
    const generatedUrl = `${baseUrl}/${latestdeploymentId}/diff`;

    info(generatedUrl);

    const headers = generateHeaders(apiKey);
    const client = new HttpClient();
    const response = await client.get(generatedUrl, headers);

    if (response.message.statusCode === 204) {
        return Promise.resolve();
    }

    if (response.message.statusCode === 200){
        const file = createWriteStream(`${downloadFolder}`);
        response.message.pipe(file).on('close', () => Promise.resolve());
        return Promise.resolve();
    }

    return Promise.reject(`getChanges: Unexpected response coming from server. ${response.message.statusCode} - ${response.readBody()} `);
}