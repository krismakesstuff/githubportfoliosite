
const username = 'krismakesstuff';
const reposContainer = document.getElementById('repos-container');
const youtubeContainer = document.getElementById('youtube-container');
const tagsContainer = document.getElementById('tags-container');
// const youtubeApiKey = 'YOUR_YOUTUBE_API_KEY';
// const youtubeChannelId = 'UCkrismakesmusic7901';

var languages = {};
// remove any repeated language tags
var languageTags =[];

var hightlightedLanguage; 


async function fetchRepos() {
    const response = await fetch(`https://api.github.com/users/${username}/repos`);
    let repos = await response.json();
    
    // Sort by updated date
    repos = repos.sort((a, b) => {
        let dateA = new Date(a.updated_at);
        let dateB = new Date(b.updated_at);

        if(dateA > dateB) return -1;    
        if(dateA < dateB) return 1;
        return 0;
    }); 
    

    // fetch readme also displays the repo
    repos.forEach(repo => fetchReadme(repo));
    
}


async function fetchReadme(repo) {
    
    const branch = repo.default_branch;
    const readme = repo.html_url + '/blob/' + branch +'/README.md';
    
    // fecth languages  
    const response = await fetch(repo.languages_url);
    languages = await response.json();
    console.log('Languages:', languages);
    
    // show repos
    displayRepo(repo, readme, languages);
    
    let tags = [];
    // add languages to languageTags
    for (const language in languages) {
        tags.push(language);
    }   

    languageTags = [...new Set(tags)];  

    console.log('Language Tags:', languageTags);
    
    // show language tags
    showLanguageTags(languageTags);
}



function displayRepo(repo, readmeURL) {  
    const repoDiv = document.createElement('div');
    repoDiv.className = 'repo';
    // convert updated and created dates to Date objects
    let updated = new Date(repo.updated_at);
    let created = new Date(repo.created_at);
    let languageString = '';
    
    // calculate the total number of bytes of code
    let languageCount = 0;
    for (const language in languages) {
        languageCount += languages[language];   
    }
    
    // calculate the percentage of code in each language
    for (const language in languages) {
        languageString += language + ':' + ((languages[language]/languageCount) * 100).toFixed(2) + '% ';
    }
    
    // add the repo to the page
    repoDiv.innerHTML = `
    <h2><a href="${repo.html_url}" target="_blank">${repo.name}</a></h2>
    <h3>${repo.description || ''}</h3>
    
    <p><strong>Language:</strong> ${languageString}</p>
    <p><strong>Updated:</strong> ${updated.toDateString()}</p>
    <p><strong>Created:</strong> ${created.toLocaleDateString()}</p>
    <br>
    
    
    <a href="${readmeURL}" target="_blank">Readme.md</a>
    `;

    // add div to the page
    reposContainer.appendChild(repoDiv);
}



function showLanguageTags(languageTags) {
    // make a grid of buttons for each language in languages
    console.log('languageTags:', languageTags);


    for (const language of languageTags) {

        // check if the language is already in the tagsContainer
        // if it is, skip it
        if (tagsContainer.innerHTML.includes(language) || language === 'Inno Setup') {
            continue;
        }

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
            }
            else {
                clearAllHighlights();
                clearAllButtons();

                languageButton.setAttribute("data-active", "true");
                highlightRepos(language);
            }

        });

        // languageButton.addEventListener('mouseover', () => {
        //     // highlight repos with the selected language
        //     highlightRepos(language);
        // });

        // languageButton.addEventListener('mouseout', () => {
        //     // remove highlights from repos with the selected language
        //     removeLanguageHighlights(language);
        // });


        console.log("made button");
        tagsContainer.appendChild(languageButton);
    }   
    
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

async function fetchYouTubeVideos() {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&channelId=${youtubeChannelId}&part=snippet,id&order=date&maxResults=10`);
    const data = await response.json();
    console.log('YouTube Data:', data);
    data.items.forEach(video => displayVideo(video));
}

function displayVideo(video) {
    const videoDiv = document.createElement('div');
    videoDiv.className = 'video';
    videoDiv.innerHTML = `
        <h2>${video.snippet.title}</h2>
        <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}">
        <p><a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank">Watch on YouTube</a></p>
    `;
    youtubeContainer.appendChild(videoDiv);
}



try {

    // on successful fetch
    fetchRepos()

    // I'll come back to this later
    //fetchYouTubeVideos();

} catch (error) {
    console.error('Error:', error);
}