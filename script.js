
const username = 'krismakesstuff'; // change username to your github username

var languages = {};
var languageTags =[];
var languageExclusions = ['C','Inno Setup']; // languages to exclude from the language tags. 

var hightlightedLanguage; 

const default_sorting = 'updated_at';

let repos = {};

async function fetchRepos() {
    // fetch repos from username
    const response = await fetch(`https://api.github.com/users/${username}/repos`);
    
    repos = await response.json();

    // update page Title, name, location, public repos, followers, and following
    updateHeaderElements(repos);

    // build the repo elements
    buildReposHTMLElement(repos).then(() => {
        // show language tags
        showLanguageTags(languageTags);
    
        // sort the repos
        sortRepos(default_sorting);
    });

}

async function updateHeaderElements(repos) {
    // fetch user data from users/username
    const response = await fetch(`https://api.github.com/users/${username}`);
    const user = await response.json();

    console.log('User:', user);

    // update page 
    document.title = user.name;
    document.getElementsByTagName('title')[0].innerText = user.name + ' - GitHub';
    document.getElementById('header-title').innerText = user.name;
    document.getElementById('header-location').innerText = user.location;
    document.getElementById('header-profile-link').href = user.html_url;
}


async function buildReposHTMLElement(repos) {
    
    let reposContainer = document.getElementById('repos-container');

    for(const repo of repos) {
        
        // fecth languages  
        const response = await fetch(repo.languages_url);
        languages = await response.json();
        //console.log('Languages:', languages);
        
        
        const branch = repo.default_branch;
        const readme = repo.html_url + '/blob/' + branch +'/README.md';

        const repoDiv = document.createElement('div');
        repoDiv.className = 'repo';
        
        // convert updated and created dates to Date objects
        
        let updated = new Date(repo.updated_at);
        let created = new Date(repo.created_at);
        
        let languageCount = 0;
        // calculate the total number of bytes of code used in the repo
        for (const language in languages) {
            languageCount += languages[language];   
        }
        
        // calculate the percentage of code in each language and add make one string
        let languageString = '';
        for (const language in languages) {
            languageString += language + ':' + ((languages[language]/languageCount) * 100).toFixed(2) + '% ';
        }
        
        // generate html 
        repoDiv.innerHTML = `
        <h2><a href="${repo.html_url}" target="_blank">${repo.name}</a></h2>
        <h3>${repo.description || ''}</h3>
        <a class="readme"href="${readme}" target="_blank">Readme.md</a>
        <p class="languages"><strong>Language:</strong> ${languageString}</p>
        <p class="updated_at"><strong>Updated:</strong> ${updated.toLocaleDateString()}</p>
        <p class="created_at"><strong>Created:</strong> ${created.toLocaleDateString()}</p>
        <br>
        `;

        // add div to the page
        reposContainer.appendChild(repoDiv);

        addLanguageTags(languages);

    }
    
    console.log('Language Tags:', languageTags);
}

function addLanguageTags(languages) {
    // add languages to languageTags
    for (const language in languages) {
        
        if(!languageTags.includes(language) && !languageExclusions.includes(language)) // check the language is not already in the array
        {
            languageTags.push(language);
        }else{
            // console.log('Language already in array:' + language);
        }
    }   
}


function sortRepos(sorting) {

    let reposContainer = document.getElementById('repos-container');
    const repos = document.getElementsByClassName('repo');
    const reposArray = Array.from(repos);

    // sort the repos by the selected sorting
    if(sorting === 'updated_at') {
        console.log('Sorting by updated_at');
        reposArray.sort((a, b) => {
            let aText = a.querySelector('.updated_at').innerText;
            let bText = b.querySelector('.updated_at').innerText;
            return new Date(aText) > new Date(bText) ? -1 : 1;
        });
    }
    else if(sorting === 'created_at') {
        console.log('Sorting by created_at');
        reposArray.sort((a, b) => {
            let aText = a.querySelector('.created_at').innerText;
            let bText = b.querySelector('.created_at').innerText;
            return new Date(aText) > new Date(bText) ? -1 : 1;
        });
    }
    else if(languageTags.includes(sorting)) {
        console.log('Sorting by language: ' + sorting);
        reposArray.sort((a, b) => {
            return a.querySelector('.languages').innerText.includes(sorting) ? -1 : 1;
        });
    }

    // clear the container
    reposContainer.innerHTML = '';

    // add the sorted repos back to the container
    for (const repo of reposArray) {
        reposContainer.appendChild(repo);
    }
}


function showLanguageTags(languageTags) {
    // make a grid of buttons for each language in languageTags

    let tagsContainer = document.getElementById('tags-container');
    let languageTagsDiv = document.createElement('div');
    languageTagsDiv.className = 'language-tags';

    for (const language of languageTags) {

        let languageButton = document.createElement('button');
        languageButton.className = 'language-tag-button';
        languageButton.innerHTML = language;

        // set button state
        languageButton.setAttribute("data-active", "false");


        languageButton.addEventListener('click', () => {
            // use button state to highlight repos with the selected language
            // buttons should be toggled on and off and change the border color of the repos as well as the button color
            if (hightlightedLanguage === language) {       
                removeLanguageHighlights(language);
                unclickButton(language);
                sortRepos(default_sorting);
            }
            else {
                clearAllHighlights();
                clearAllButtons();
                
                languageButton.setAttribute("data-active", "true");
                highlightRepos(language);
                sortRepos(language);
            }

        });

        languageTagsDiv.appendChild(languageButton);
    }   
    
    tagsContainer.appendChild(languageTagsDiv);
}   

function highlightRepos(language) { 
    hightlightedLanguage = language;
    // highlight repos with the selected language
    const repos = document.getElementsByClassName('repo');
    for (const repo of repos) {
        const languageString = repo.querySelector('p').innerText;
        if (languageString.includes(language)) {
            // set custom css variable 
            //repo.style.border = 'solid red';
            repo.setAttribute("data-highlight", "true");

        } else {
            //repo.style.border = 'solid var(--light-blue);';
            repo.setAttribute("data-highlight", "false");
        }
    }
}

function removeLanguageHighlights(language) {
 
    hightlightedLanguage = null;
    // remove highlights from repos with the selected language
    const repos = document.getElementsByClassName('repo');
    for (const repo of repos) {
        const languageString = repo.querySelector('p').innerText;
        if (languageString.includes(language)) {
            // repo.style.border = 'solid var(--light-blue)';
            repo.setAttribute("data-highlight", "false");
        }
    }
}

function clearAllHighlights() { 
    hightlightedLanguage = null;

    // clear all highlights
    const repos = document.getElementsByClassName('repo');
    for (const repo of repos) {
        //repo.style.border = 'solid var(--light-blue)';
        repo.setAttribute("data-highlight", "false");
    }
}

function clearAllButtons() {    
    // clear all buttons
    const buttons = document.getElementsByClassName('language-tag-button');
    for (const button of buttons) {
        // button.style.backgroundColor = 'var(--dark-blue)';
        button.setAttribute("data-active", "false");
    }
}

function unclickButton(language) {
    // unclick the button
    const buttons = document.getElementsByClassName('language-tag-button');
    for (const button of buttons) {
        if (button.innerHTML === language) {
            // button.style.backgroundColor = 'var(--light-blue)';
            button.setAttribute("data-active", "false");
        }
    }
}

// async function fetchYouTubeVideos() {
//     const response = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&channelId=${youtubeChannelId}&part=snippet,id&order=date&maxResults=10`);
//     const data = await response.json();
//     console.log('YouTube Data:', data);
//     data.items.forEach(video => displayVideo(video));
// }

// function displayVideo(video) {
//     const videoDiv = document.createElement('div');
//     videoDiv.className = 'video';
//     videoDiv.innerHTML = `
//         <h2>${video.snippet.title}</h2>
//         <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}">
//         <p><a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank">Watch on YouTube</a></p>
//     `;
//     youtubeContainer.appendChild(videoDiv);
// }



// main
try {

    // on successful fetch
    fetchRepos()

    // I'll come back to this later
    //fetchYouTubeVideos();

} catch (error) {
    console.error('Error:', error);
}