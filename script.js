
let username = 'krismakesstuff'; // change username to your github username
let languageExclusions = ['C','Inno Setup']; // languages to exclude from the language tags.

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
        document.getElementById('header-title').innerText = 'Error: ' + error.message;

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
        repoDiv.setAttribute("data-highlight", "false");

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
            languageString += language + ': ' + ((languages[language]/languageCount) * 100).toFixed(2) + '% ';
        }

        // generate html
        repoDiv.innerHTML = `
        <a class="name" href="${repo.html_url}" target="_blank">${repo.name}</a>
        <p class="description">${repo.description || ''}</p>
        <p class="updated_at"><strong>Updated:</strong> ${updated.toLocaleDateString()}</p>
        <p class="created_at"><strong>Created:</strong> ${created.toLocaleDateString()}</p>
        <p class="languages"><strong>Language:</strong> ${languageString}</p>
        <div class="readme-container"> <a class="readme" href="${readme}" target="_blank">Readme.md</a></div>
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
  // Store current scroll position
  const scrollPosition = window.scrollY;

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

  // First, mark all elements with a position before reordering
  reposArray.forEach((repo, index) => {
    const rect = repo.getBoundingClientRect();
    repo.dataset.oldLeft = rect.left;
    repo.dataset.oldTop = rect.top;
  });

  // clear the container and append in new order
  reposContainer.innerHTML = '';
  for (const repo of reposArray) {
    reposContainer.appendChild(repo);

    // Force a reflow to calculate new positions
    repo.offsetHeight;
  }

  // Animate from old position to new position
  reposArray.forEach((repo) => {
    const oldLeft = parseFloat(repo.dataset.oldLeft);
    const oldTop = parseFloat(repo.dataset.oldTop);
    const newRect = repo.getBoundingClientRect();

    // Create the animation using FLIP technique
    repo.style.transition = 'none';
    repo.style.transform = `translate(${oldLeft - newRect.left}px, ${oldTop - newRect.top}px)`;

    // Force reflow
    repo.offsetHeight;

    // Start animation
    repo.style.transition = 'transform 0.5s ease-out';
    repo.style.transform = 'translate(0, 0)';

    // Clean up
    setTimeout(() => {
    repo.style.transition = '';
    repo.style.transform = '';
    delete repo.dataset.oldLeft;
    delete repo.dataset.oldTop;
    }, 500);
  });

  // Restore scroll position
  window.scrollTo({
    top: scrollPosition
  });
}

// make a grid of buttons for each language in languageTags
function showLanguageTags(languageTags) {

    let tagsContainer = document.getElementById('tags-container');
    // let languageTagsDiv = document.createElement('div');
    // languageTagsDiv.className = 'language-tags';

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
        // languageTagsDiv.appendChild(languageButton);
        // add language tags to the page
        tagsContainer.appendChild(languageButton);
    }
}

// used by language tab buttons to highlight repos with the selected language
function highlightRepos(language) {
    hightlightedLanguage = language;
    // highlight repos with the selected language
    const repos = document.getElementsByClassName('repo');
    for (const repo of repos) {
        const languageString = repo.querySelector('.languages').innerHTML;
        if (languageString.includes(language)) {
            repo.setAttribute("data-highlight", "true");
        }
    }
}

// used by language tab buttons to remove highlights from repos with the selected language
function removeLanguageHighlights(language) {

    hightlightedLanguage = null;
    // remove highlights from repos with the selected language
    const repos = document.getElementsByClassName('repo');
    for (const repo of repos) {
        // find the language id and set repo attribute to false
        const languageString = repo.querySelector('.languages').innerHTML;
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


document.getElementById('search-button').addEventListener('click', function() {
  const input = document.getElementById('search-input').value;
  if (input) {
    // Remove whitespace from input
    const trimmedInput = input.trim();
    if (trimmedInput !== input) {
      document.getElementById('search-input').value = trimmedInput;
    }
    console.log('Searching for user:', trimmedInput);

    // Update the global username and reset data
    username = trimmedInput;
    languages = {};
    languageTags = [];
    hightlightedLanguage = null;

    // Clear existing repos and tags
    document.getElementById('repos-container').innerHTML = '';
    document.getElementById('tags-container').innerHTML = '';

    // Fetch and display the new repos
    fetchRepos();
  }
});

document.getElementById('search-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission
        document.getElementById('search-button').click(); // Trigger the search button click
    }
});

// main
try {

    fetchRepos()

} catch (error) {

    console.error('Error:', error);
}
