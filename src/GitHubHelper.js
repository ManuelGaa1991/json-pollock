import 'whatwg-fetch';
import 'babel-polyfill';

const GITHUB_API = 'https://api.github.com';

const STORAGE_KEYS = {
  GITHUB_TOKEN: 'jsonPollockPlaygroundGithubToken',
  GIST_PREFIX: 'jsonPollockPlayground',
};

class Gist {
  constructor(name, content, url) {
    this.name = name;
    this.content = content;
    this.url = url;
    this.isGist = true;
  }
}

const getUserDetails = (token) => {
  const options = { headers: { Authorization: `token ${token}` } };
  return fetch(`${GITHUB_API}/user`, options).then((res) => {
    if (res.status === 200) {
      return res.json();
    }
    return '';
  });
};

const loadGist = (gistId, filename, token) => {
  let storedGist;
  const storedGistStr = localStorage.getItem(`${STORAGE_KEYS.GIST_PREFIX}_${gistId}`);
  if (storedGistStr) {
    storedGist = JSON.parse(storedGistStr);
  }
  const options = { headers: { Authorization: `token ${token}` } };
  if (storedGist) {
    options.headers['If-None-Match'] = storedGist.etag;
  }
  return fetch(`${GITHUB_API}/gists/${gistId}`, options)
          .then((res) => {
            if (res.status === 304) { // not changed
              return { gist: storedGist };
            }
            const etag = res.headers.get('Etag');
            return res.json().then((json => ({ gist: json, etag })));
          })
          .then((res) => {
            const gist = res.gist;
            if (res.etag) {
              localStorage.setItem(`${STORAGE_KEYS.GIST_PREFIX}_${gistId}`, JSON.stringify({ ...gist, etag: res.etag }));
            }
            const files = gist.files && Object.keys(gist.files);
            if (files && files.length) {
              const file = filename && gist.files[filename] ?
                gist.files[filename] :
                gist.files[files[0]];
              return new Gist(file.filename, file.content, gist.html_url);
            }
            return gist;
          });
};

const saveToken = (token) => {
  localStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, token);
};

const getToken = () => localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN);

export default {
  loadGist,
  saveToken,
  getToken,
  getUserDetails,
};