import {HttpClient, MediaTypes, Headers } from '@actions/http-client';
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
    const headers = generateHeaders(apiKey);

    const client = new HttpClient();
    var response = await client.getJson<DeploymentsResponse>(`${baseUrl}?skip=0&take=1`, headers);

    if (response.statusCode === 200 && response.result !== null)
    {
        return Promise.resolve(response.result.deployments[0].deploymentId);
    }

    return Promise.reject(`Unexpected response coming from server. ${response.statusCode} - ${JSON.stringify(response.result)} `);
}

export async function getChanges(baseUrl: string, apiKey: string, latestdeploymentId: string, downloadFolder: string) : Promise<void>
{
    const headers = generateHeaders(apiKey);
    const client = new HttpClient();
    const response = await client.get(`${baseUrl}/${latestdeploymentId}/diff`, headers);

    if (response.message.statusCode === 204) {
        return Promise.resolve();
    }

    if (response.message.statusCode === 200){
        const file = createWriteStream(`${downloadFolder}`);
        response.message.pipe(file).on('close', () => Promise.resolve());
        return Promise.resolve();
    }

    return Promise.reject(`Unexpected response coming from server. ${response.message.statusCode} - ${response.readBody()} `);
}