import { exec } from '@actions/exec';
import { rmRF } from '@actions/io';

export async function patch(patchFileLocation: string, githubToken: string, run: string) : Promise<void>
{
    return await new Promise(async (resolve, reject) => {
        try {
        const branchName = `auto/merge_remote_changes_for_run_${run}`

        await exec("git", ["config", "user.name", `"Build pipeline"`]);
        await exec("git", ["config", "user.email", "cicd+github@umbraco.com"]);
        await exec("git", ["switch", "-c", `${branchName}`]);
        await exec("git", ["apply", "-v", `${patchFileLocation}`]);

        rmRF(patchFileLocation);

        await exec("git", ["commit", "-a", "-m", `"Auto Updated changes from remote for build ${run}"`]);
        await exec("git", ["remote", "add", "tmp-pusher", `https://${githubToken}@github.com/jesp209i/pipelines-r-us`]);         
        await exec("git", ["push", "--set-upstream", "tmp-pusher", `${branchName}`]);
        
        return resolve();
        }
        catch (error){
            return reject(error)
        }
    });
}