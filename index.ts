const matchAll = require("match-all");

import * as core from '@actions/core';
import * as github from '@actions/github';
import { PayloadRepository } from '@actions/github/lib/interfaces';
import { Octokit } from "@octokit/rest";

async function extractJiraKeysFromCommit() {
    const regex = /((([A-Z]+)|([0-9]+))+-\d+)/g;

    try {
        const isPullRequest = core.getInput('is-pull-request') == 'true';
        const commitMessage = core.getInput('commit-message');
        const parseAllCommits = core.getInput('parse-all-commits') == 'true';

        const payload = github.context.payload;

        const octokit = await setupOctokit()

        let result: string = '';
        let matches: string[] = [];
        if (isPullRequest) {
            let resultArr: any = [];

            const payloadRepo = payload.repository as PayloadRepository;
            const owner = payloadRepo.owner.login;
            const repo = payloadRepo.name;
            const prNum = payload.number;

            const { data } = await octokit.rest.pulls.listCommits({
                owner,
                repo,
                pull_number: prNum,
            });

            if (data && data.length) {
                data.forEach((item: any) => {
                    const commit = item.commit;
                    matches = matchAll(commit.message, regex).toArray();
                    if (matches && matches.length) {
                        matches.forEach((match: string) => {
                            if (!resultArr.includes(match)) resultArr.push(match);
                        });
                    }
                });
                result = resultArr.join(',');
            }
        }
        else {
            if (commitMessage) {
                matches = matchAll(commitMessage, regex).toArray();
                if (matches && matches.length) {
                    result = matches.join(',');
                }
            }

            else {
                if (parseAllCommits && payload && payload.commits && payload.commits.length) {
                    let resultArr: any = [];

                    payload.commits.forEach((commit: any) => {
                        if (commit.message) {
                            matches = matchAll(commit.message, regex).toArray();
                            matches.forEach((match: string) => {
                                if (!resultArr.includes(match)) resultArr.push(match);
                            });
                        }
                    });

                    result = resultArr.join(',');
                }
                else {
                    if (payload.head_commit && payload.head_commit.message) {
                        matches = matchAll(payload.head_commit.message, regex).toArray();
                        if (matches && matches.length) {
                            result = matches.join(',');
                        }
                    }
                }
            }
        }

        if (result && result.length) core.setOutput("jira-keys", result);

    } catch (error) {
        core.setFailed(`Action failed with error ${error}`);
    }
}

(async function () {
    await extractJiraKeysFromCommit();
})();

async function setupOctokit(): Promise<Octokit> {
    return new Octokit({
        auth: `${process.env.GITHUB_TOKEN}`,
    });
}

export default extractJiraKeysFromCommit
