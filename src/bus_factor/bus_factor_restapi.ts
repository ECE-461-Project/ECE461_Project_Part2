const axios = require('axios');

export async function get_percent_owner(github_repo_url: string): Promise<number | undefined>{
    const reg = new RegExp('github\\.com/([A-Za-z0-9_]*-*)+/([A-Za-z0-9_]*-*)+');
    const matches = github_repo_url.match(reg);
    if (matches === null) {
        return undefined;
    }
    if (process.env.GITHUB_TOKEN === undefined) {
        throw new Error('GITHUB_TOKEN is not defined');
    }
    let repoAdr: string = 'https://api.github.com/repos/' + matches[1] + '/' + matches[2];
    let commitsAdr: string = 'https://api.github.com/repos/' + matches[1] + '/' + matches[2] + '/commits';

    let repoData: any = 0
    await axios.get(repoAdr)
        .then((response: any) => {
            repoData = response.data
        })

    let commitsData: any = 0
    await axios.get(commitsAdr)
        .then((response: any) => {
            commitsData = response.data
        })
    //globalThis.logger.debug('get_number_contributors query: ' + repo.data);
    let owner = repoData.owner.id;
    let ownerCommits = 0;
    let otherCommits = 0;
    for(let i = 0; i < 30; i++){
        if(commitsData[i] == undefined){
            break;
        }
        if(commitsData[i].author.id == owner){
            ownerCommits += 1;
        }
        else{
            otherCommits += 1;
        }
    }
    let percentOwner = ownerCommits / (ownerCommits + otherCommits );
    return percentOwner;
}


