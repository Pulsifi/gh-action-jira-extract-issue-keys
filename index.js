"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const matchAll = require("match-all");
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const rest_1 = require("@octokit/rest");
async function extractJiraKeysFromCommit() {
    const regex = /((([A-Z]+)|([0-9]+))+-\d+)/g;
    try {
        const isPullRequest = core.getInput('is-pull-request') == 'true';
        const commitMessage = core.getInput('commit-message');
        const parseAllCommits = core.getInput('parse-all-commits') == 'true';
        const payload = github.context.payload;
        const octokit = await setupOctokit();
        let result = '';
        let matches = [];
        if (isPullRequest) {
            let resultArr = [];
            const payloadRepo = payload.repository;
            const owner = payloadRepo.owner.login;
            const repo = payloadRepo.name;
            const prNum = payload.number;
            const { data } = await octokit.rest.pulls.listCommits({
                owner,
                repo,
                pull_number: prNum,
            });
            if (data && data.length) {
                data.forEach((item) => {
                    const commit = item.commit;
                    matches = matchAll(commit.message, regex).toArray();
                    if (matches && matches.length) {
                        matches.forEach((match) => {
                            if (!resultArr.includes(match))
                                resultArr.push(match);
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
                    let resultArr = [];
                    payload.commits.forEach((commit) => {
                        if (commit.message) {
                            matches = matchAll(commit.message, regex).toArray();
                            matches.forEach((match) => {
                                if (!resultArr.includes(match))
                                    resultArr.push(match);
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
        if (result && result.length)
            core.setOutput("jira-keys", result);
    }
    catch (error) {
        core.setFailed(`Action failed with error ${error}`);
    }
}
(async function () {
    await extractJiraKeysFromCommit();
})();
async function setupOctokit() {
    return new rest_1.Octokit({
        auth: `${process.env.GITHUB_TOKEN}`,
    });
}
exports.default = extractJiraKeysFromCommit;
