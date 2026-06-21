const { Octokit } = require("@octokit/rest");

const USERNAME = process.env.GITHUB_USERNAME || "spideythedev";
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("GITHUB_TOKEN is required");
  process.exit(1);
}

const octokit = new Octokit({ auth: TOKEN });

async function getFollowers() {
  const followers = [];
  let page = 1;
  
  while (true) {
    try {
      const { data } = await octokit.rest.users.listFollowersForUser({
        username: USERNAME,
        per_page: 100,
        page: page
      });
      
      if (data.length === 0) break;
      followers.push(...data.map(user => user.login));
      page++;
    } catch (error) {
      console.error(`Error fetching followers: ${error.message}`);
      break;
    }
  }
  
  return followers;
}

async function getFollowing() {
  const following = [];
  let page = 1;
  
  while (true) {
    try {
      const { data } = await octokit.rest.users.listFollowingForUser({
        username: USERNAME,
        per_page: 100,
        page: page
      });
      
      if (data.length === 0) break;
      following.push(...data.map(user => user.login));
      page++;
    } catch (error) {
      console.error(`Error fetching following: ${error.message}`);
      break;
    }
  }
  
  return following;
}

async function followUser(username) {
  try {
    await octokit.rest.users.follow({ username });
    console.log(`Followed back: ${username}`);
    return true;
  } catch (error) {
    if (error.status === 403) {
      console.log("Rate limit hit, waiting 60 seconds...");
      await new Promise(resolve => setTimeout(resolve, 60000));
      return followUser(username);
    }
    console.error(`Failed to follow ${username}: ${error.message}`);
    return false;
  }
}

async function autoFollowBack() {
  console.log(`Auto Follow Bot - ${USERNAME}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  const followers = await getFollowers();
  const following = await getFollowing();
  
  console.log(`Followers: ${followers.length}`);
  console.log(`Following: ${following.length}`);
  
  const toFollow = followers.filter(f => !following.includes(f));
  console.log(`Need to follow back: ${toFollow.length}`);
  
  for (let i = 0; i < toFollow.length; i++) {
    await followUser(toFollow[i]);
    if (i < toFollow.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log("Complete!");
}

autoFollowBack();