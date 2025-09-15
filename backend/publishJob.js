import fs from "fs";
import fetch from "node-fetch";

// LinkedIn API: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api

export async function publishScheduled({ imagePath, caption, linkedinActorUrn, accessToken }) {
  console.log("Uploading asset to LinkedIn...");

  // Step 1: Register upload
  const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      registerUploadRequest: {
        owner: linkedinActorUrn,
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        serviceRelationships: [
          {
            identifier: "urn:li:userGeneratedContent",
            relationshipType: "OWNER"
          }
        ]
      }
    })
  });

  const registerData = await registerRes.json();
  const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
  const asset = registerData.value.asset;

  // Step 2: Upload image binary
  const imageBuffer = fs.readFileSync(imagePath);
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: imageBuffer
  });

  // Step 3: Create post
  const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0"
    },
    body: JSON.stringify({
      author: linkedinActorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: caption },
          shareMediaCategory: "IMAGE",
          media: [{ status: "READY", media: asset }]
        }
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "CONNECTIONS" }
    })
  });

  const postData = await postRes.json();
  console.log("Post published:", postData);
  return postData;
}
