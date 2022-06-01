## Scrapings from OpenSea

### Landing Page
- "Explore" button to go to marketplace
- "Create" button to go to creation panel
- Link to one random NFT ( may be NFT of the day )
- Link to another random NFT ( maybe second best of the day)
- Top collections of last 7 days { name, image, price, percentage increase or decrease }
- Button to go to rankings
- Trending NFTs 
- Browse by category
 - Each category has a image and name.

### Profile Page
- Whenever the user logs in send a request to the backend to retrieve that user's 
    account details.
- Profile page has image, banner, username, is_verified ?, wallet, joinig date
- Following sections are there : 
  - Collected : ( all the NFTs this guy owns )
  - Created ( What this guy has Minted )
    - Items (Single Items)
    - Collections ( basically an array of Single Items )
  - Favorited : NFTs that the user has marked with a heart
  - Activity () Activities over this guys NFTs) : (item, price, quantity, from, to time)
    - Minted 
    - List
    - Cancel 
    - Sale
    - Transfer 
 - Offers ( item, unit price, USD price, floor difference, from, expiration, recived date  )
    - Received 
    - Made

### Settings page
- Basically where the user can edit his/her profile details
- We will add "Link YouTube Account" button so that we can fetch the users YouTube videos.