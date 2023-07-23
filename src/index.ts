import { getInput, info, setFailed, warning, setOutput } from '@actions/core';
import { getLatestDeploymentFromApi, getChanges } from './getChangesDeploymentApi';
import { exists } from '@actions/io/lib/io-util';

async function run() 
{
    const projectAlias = getInput('project-alias');
    const apiKey = getInput('api-key');
    const workspace = getInput('workspace');

    const baseUrl = `https://api-internal.umbraco.io/projects/${projectAlias}/deployments`;

    let latestdeploymentId: string = '';

    await getLatestDeploymentFromApi(baseUrl,apiKey)
    .then(resolve => latestdeploymentId = resolve)
    .catch(rejected => setFailed(rejected));

    const placeForPatch = `${workspace}/download/git-changes.patch`;

    getChanges(baseUrl, apiKey, latestdeploymentId, placeForPatch)
    .then(()=>success(placeForPatch),
    ()=> setFailed("Unknown Error - unable to determine what happened :("));


}

async function success(patchfileLocation: string){
    const patchFileExists = await exists(patchfileLocation);
    if (patchFileExists){
        warning(`Changes since last deployment was detected - see ${patchfileLocation}`);
        setOutput('remote-changes', true);
        setOutput('git-patch-file', patchfileLocation);
        return;
    }

    info("No remote changes");
    setOutput('remote-changes', false);
}


run();

