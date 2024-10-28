
const username = 'krismakesstuff'; // change username to your github username
const languageExclusions = ['C','Inno Setup']; // languages to exclude from the language tags. 

var languages = {};
var languageTags =[];

var hightlightedLanguage; 

const default_sorting = 'updated_at';

let repos = {};

// called from the main function to fetch repos from the username and build the page
async function fetchRepos() {
    // fetch repos from username
    const response = await fetch(`https://api.github.com/users/${username}/repos`);
    
    // handle error response
    if (!response.ok) {
        // display error message, read json response
        const error = await response.json();
        console.error('Error:', error);

        // display error message in the header
        document.getElementById('header-title').innerText = 'Error: ' + error.message + ' - refresh the page after waiting a few minutes';
    
        return;
    }

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

// fetch user data from users/username and update header elements
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
    document.getElementById('header-num-repos').innerText = user.public_repos + ' Repos';
}

// create a div for each repo and add it to the page
async function buildReposHTMLElement(repos) {
    
    let reposContainer = document.getElementById('repos-container');

    for(const repo of repos) {
        
        // fecth languages  
        const response = await fetch(repo.languages_url);
        languages = await response.json();
        
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
        
        // calculate the percentage of code in each language and create a string
        let languageString = '';
        for (const language in languages) {
            languageString += language + ':' + ((languages[language]/languageCount) * 100).toFixed(2) + '% ';
        }
        
        // generate html 
        repoDiv.innerHTML = `
        <h3 class="name"><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
        <p class="description">${repo.description || ''}</p>
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

// add languages to languageTags array
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

// sort the repos by the selected sorting
function sortRepos(sorting) {

    let reposContainer = document.getElementById('repos-container');
    const repos = document.getElementsByClassName('repo');
    const reposArray = Array.from(repos);

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
        
        // sort repos by language
        reposArray.sort((a, b) => {
            let aResult = a.querySelector('.languages').innerText.includes(sorting) ? -1 : 1;
            return aResult;
        });

        // sort repos by updated_at only if they have the same language as the sorting
        reposArray.sort((a, b) => {
            if(a.querySelector('.languages').innerText.includes(sorting) && b.querySelector('.languages').innerText.includes(sorting)){
                let aText = a.querySelector('.updated_at').innerText;
                let bText = b.querySelector('.updated_at').innerText;
                return new Date(aText) > new Date(bText) ? -1 : 1;
            }
        });

    }

    // clear the container
    reposContainer.innerHTML = '';

    // add the sorted repos back to the container
    for (const repo of reposArray) {
        reposContainer.appendChild(repo);
    }
}

// make a grid of buttons for each language in languageTags
function showLanguageTags(languageTags) {

    let tagsContainer = document.getElementById('tags-container');
    let languageTagsDiv = document.createElement('div');
    languageTagsDiv.className = 'language-tags';

    for (const language of languageTags) {

        // make button
        let languageButton = document.createElement('button');
        languageButton.className = 'language-tag-button';
        languageButton.innerHTML = language;

        // set button state
        languageButton.setAttribute("data-active", "false");

        // add event listener to button 
        languageButton.addEventListener('click', () => {
            // use button state to highlight repos with the selected language
            if (hightlightedLanguage === language) {  
                // language is already highlighted, remove highlights     
                removeLanguageHighlights(language);
                languageButton.setAttribute("data-active", "false");
                // reset the sorting
                sortRepos(default_sorting);
            }
            else {
                // clear any other highlights 
                clearAllHighlights();
                clearAllButtons();

                // highlight repos with the selected language and sort 
                languageButton.setAttribute("data-active", "true");
                highlightRepos(language);
                sortRepos(language);
            }
        });
        // add button to the page
        languageTagsDiv.appendChild(languageButton);
    }   
    // add language tags to the page
    tagsContainer.appendChild(languageTagsDiv);
}   

// used by language tab buttons to highlight repos with the selected language 
function highlightRepos(language) { 
    hightlightedLanguage = language;
    // highlight repos with the selected language
    const repos = document.getElementsByClassName('repo');
    for (const repo of repos) {
        const languageString = repo.querySelector('p').innerText;
        if (languageString.includes(language)) {
            repo.setAttribute("data-highlight", "true");

        } else {
            repo.setAttribute("data-highlight", "false");
        }
    }
}

// used by language tab buttons to remove highlights from repos with the selected language
function removeLanguageHighlights(language) {
 
    hightlightedLanguage = null;
    // remove highlights from repos with the selected language
    const repos = document.getElementsByClassName('repo');
    for (const repo of repos) {
        const languageString = repo.querySelector('p').innerText;
        if (languageString.includes(language)) {
            repo.setAttribute("data-highlight", "false");
        }
    }
}

// used by language tab buttons to remove highlights from all repos
function clearAllHighlights() { 
    hightlightedLanguage = null;

    // clear all highlights
    const repos = document.getElementsByClassName('repo');
    for (const repo of repos) {
        //repo.style.border = 'solid var(--light-blue)';
        repo.setAttribute("data-highlight", "false");
    }
}

// used by language tab buttons to clear all buttons
function clearAllButtons() {    
    // clear all buttons
    const buttons = document.getElementsByClassName('language-tag-button');
    for (const button of buttons) {
        button.setAttribute("data-active", "false");
    }
}


// main
try {

    fetchRepos()

} catch (error) {
    
    console.error('Error:', error);
}