import { getInput, info, setFailed, warning, setOutput } from '@actions/core';
import { getLatestDeployment, getDiff } from './getChangesDeploymentApi';
import { exists } from '@actions/io/lib/io-util';
import { mkdirP } from '@actions/io';

async function run() 
{
    const projectAlias = getInput('project-alias');
    const apiKey = getInput('api-key');
    const workspace = getInput('workspace');

    const baseUrl = `https://api-internal.umbraco.io/projects/${projectAlias}/deployments`;

    const latestdeploymentId = await getLatestDeployment(baseUrl,apiKey)
        .catch(rejected => setFailed(rejected));

    if (latestdeploymentId !== null || undefined){

        info(`Latest deploymentId: ${latestdeploymentId}`);

        const downloadPath = `${workspace}/download`;

        mkdirP(downloadPath);

        const placeForPatch = `${downloadPath}/git-changes.patch`;

        await getDiff(baseUrl, apiKey, latestdeploymentId!, placeForPatch)
        .catch(rejected => setFailed(`GetDiff - Unable to determine what happened :( ${rejected}`));

        success(placeForPatch);
        return;
    }
    else {
        info("No latest deploymentId");
        setOutput('REMOTE_CHANGES', 'false');
        setFailed("fail on purpose for now");
    }
}

async function success(patchfileLocation: string){
    const patchFileExists = await exists(patchfileLocation);
    if (patchFileExists){
        warning(`Changes since last deployment was detected - see ${patchfileLocation}`);
        setOutput('REMOTE_CHANGES', 'true');
        setOutput('PATCH_FILE', patchfileLocation);
    } 
    else 
    {
        info("No remote changes");
        setOutput('REMOTE_CHANGES', 'false');
    }
}

run();

