import { getInput, info, setFailed, warning, setOutput } from '@actions/core';
import { getLatestDeploymentFromApi, getChanges } from './getChangesDeploymentApi';
import { exists } from '@actions/io/lib/io-util';
import { mkdirP } from '@actions/io';

async function run() 
{
    const projectAlias = getInput('project-alias');
    const apiKey = getInput('api-key');
    const workspace = getInput('workspace');

    const baseUrl = `https://api-internal.umbraco.io/projects/${projectAlias}/deployments`;

    const latestdeploymentId = await getLatestDeploymentFromApi(baseUrl,apiKey)
        .catch(rejected => setFailed(rejected));

    if (latestdeploymentId !== null || undefined){

        info(`Found latest deploymentId: ${latestdeploymentId}`);

        const downloadPath = `${workspace}/download`;

        mkdirP(downloadPath);

        const placeForPatch = `${downloadPath}/git-changes.patch`;

        await getChanges(baseUrl, apiKey, latestdeploymentId!, placeForPatch)
        .catch(rejected => setFailed(`GetDiff - Unable to determine what happened :( ${rejected}`));

        success(placeForPatch);
        return;
    }

    info("No latest deploymentId");
    setOutput('remote-changes', false);
    setFailed("fail on purpose for now");

}

async function success(patchfileLocation: string){
    const patchFileExists = await exists(patchfileLocation);
    if (patchFileExists){
        warning(`Changes since last deployment was detected - see ${patchfileLocation}`);
        setOutput('remote-changes', true);
        setOutput('git-patch-file', patchfileLocation);
        return;
    } 
    else 
    {
        info("No remote changes");
        setOutput('remote-changes', false);
    }
}


run();

