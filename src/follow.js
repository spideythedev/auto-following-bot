const { Octokit } = require("@octokit/rest");

const USERNAME = process.env.GITHUB_USERNAME || "spideythedev";
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("GITHUB_TOKEN is required");
  process.exit(1);
}

const octokit = new Octokit({ auth: TOKEN });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAllPages(fetchPage) {
  const results = [];
  let page = 1;

  while (true) {
    try {
      const { data } = await fetchPage(page);
      if (!data.length) break;
      results.push(...data.map((user) => user.login));
      page++;
    } catch (error) {
      console.error(`Error fetching data: ${error.message}`);
      break;
    }
  }

  return results;
}

async function getFollowers() {
  return fetchAllPages((page) =>
    octokit.rest.users.listFollowersForUser({
      username: USERNAME,
      per_page: 100,
      page,
    })
  );
}

async function getFollowing() {
  return fetchAllPages((page) =>
    octokit.rest.users.listFollowingForUser({
      username: USERNAME,
      per_page: 100,
      page,
    })
  );
}

async function followUser(username) {
  try {
    await octokit.rest.users.follow({ username });
    console.log(`Followed back: ${username}`);
    return true;
  } catch (error) {
    if (error.status === 403) {
      console.log("Rate limit hit, waiting 60 seconds...");
      await sleep(60000);
      return followUser(username);
    }
    console.error(`Failed to follow ${username}: ${error.message}`);
    return false;
  }
}

async function autoFollowBack() {
  console.log(`Auto Follow Bot - ${USERNAME}`);
  console.log(`Time: ${new Date().toISOString()}`);

  const [followers, following] = await Promise.all([
    getFollowers(),
    getFollowing(),
  ]);

  console.log(`Followers: ${followers.length}`);
  console.log(`Following: ${following.length}`);

  const toFollow = followers.filter((user) => !following.includes(user));
  console.log(`Need to follow back: ${toFollow.length}`);

  for (const [index, user] of toFollow.entries()) {
    await followUser(user);
    if (index < toFollow.length - 1) {
      await sleep(2000);
    }
  }

  console.log("Complete!");
}

autoFollowBack();