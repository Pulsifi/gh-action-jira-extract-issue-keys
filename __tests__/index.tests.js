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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
const index_1 = __importDefault(require("../index"));
const nock_1 = __importDefault(require("nock"));
beforeEach(() => {
    jest.resetModules();
    /** create github token and add her for real run */
    process.env['GITHUB_TOKEN'] = '';
    github.context.payload = {
        repository: {
            owner: {
                login: 'Pulsifi',
            },
            name: 'github-template',
        },
        number: 1,
        commits: [],
    };
});
afterAll(() => {
    expect(nock_1.default.pendingMocks()).toEqual([]);
    nock_1.default.isDone();
    nock_1.default.cleanAll();
});
describe('debug action debug messages', () => {
    it('extract Jira Keys From Commit does not thow', async () => {
        jest.spyOn(core, 'getInput').mockImplementation((name) => {
            if (name === 'is-pull-request')
                return 'false';
            if (name === 'commit-message')
                return '';
            if (name === 'parse-all-commits')
                return 'false';
            return '';
        });
        await expect((0, index_1.default)()).resolves.not.toThrow();
    });
    it('isPullRequest is true', async () => {
        const tokenNumber = jest.spyOn(core, 'getInput').mockImplementation((name) => {
            if (name === 'is-pull-request')
                return 'true';
            if (name === 'commit-message')
                return '';
            if (name === 'parse-all-commits')
                return 'false';
            return '';
        });
        await (0, index_1.default)();
        expect(tokenNumber.mock.results.length == 4);
        expect(tokenNumber.mock.results[0].value).toMatch('true');
        expect(tokenNumber.mock.results[1].value).toMatch('');
        expect(tokenNumber.mock.results[2].value).toMatch('false');
    });
    it('false isPullRequest, true commit', async () => {
        jest.spyOn(core, 'getInput').mockImplementation((name) => {
            if (name === 'is-pull-request')
                return 'false';
            if (name === 'commit-message')
                return 'CHAR-123 the commit message';
            if (name === 'parse-all-commits')
                return 'false';
            return '';
        });
        const coreOutput = jest.spyOn(core, 'setOutput').mockImplementationOnce((name) => {
            if (name === 'jira-keys')
                return 'true';
            return '';
        }).mockImplementation((name) => {
            if (name === 'jira-keys')
                return 'false';
            return '';
        });
        await (0, index_1.default)();
        expect(coreOutput.mock.results.length).toBe(1);
        expect(coreOutput.mock.results[0].value).toMatch('true');
    });
    it('false isPullRequest, no commit-message input, true parseAllCommits', async () => {
        jest.spyOn(core, 'getInput').mockImplementation((name) => {
            if (name === 'is-pull-request')
                return 'false';
            if (name === 'commit-message')
                return 'CHAR-123 test commit msg';
            if (name === 'parse-all-commits')
                return 'true';
            return '';
        });
        const coreOutput = jest.spyOn(core, 'setOutput').mockImplementationOnce((name) => {
            if (name === 'jira-keys')
                return 'CHAR-1 blue';
            return '';
        }).mockImplementationOnce((name) => {
            if (name === 'jira-keys')
                return 'CHAR-2 red';
            return '';
        }).mockImplementation((name) => {
            if (name === 'jira-keys')
                return 'CHAR-3 green';
            return '';
        });
        await ((0, index_1.default)());
        expect(coreOutput.mock.results.length).toBe(1);
        expect(coreOutput.mock.results[0].value).toMatch('blue');
    });
});
