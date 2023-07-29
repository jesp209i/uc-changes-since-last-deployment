import { exec } from '@actions/exec';

export async function patch(patchFileLocation: string, githubToken: string, run: string) : Promise<void>
{
    return new Promise((resolve, reject) => {
        try {
        const branchName = `auto/merge_remote_changes_for_run_${run}`

        exec("git", ["config", "user.name", `"Build pipeline"`]);
        exec("git", ["config", "user.email", "cicd+github@umbraco.com"]);
        exec("git", ["switch", "-c", `${branchName}`]);
        exec("git", ["apply", "-v", `${patchFileLocation}`]);

        exec("git", ["commit", "-a", "-m", `"Auto Updated changes from remote for build ${run}"`]);
        exec("git", ["remote", "add", "tmp-pusher", `https://${githubToken}@github.com/jesp209i/pipelines-r-us`]);         
        exec("git", ["push", "--set-upstream", "tmp-pusher", `${branchName}`]);
        
        return resolve();
        }
        catch (error){
            return reject(error)
        }
    });
}