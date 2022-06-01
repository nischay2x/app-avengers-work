## API ENDPOINTS 

#### jwt token should always be attached to the Authorization header

### Auth
- POST /auth/address
  - Requires - { address : wallet_address } ( wallet address in req.body )
  - Response - { nonce : nonce_to_sign }

- POST /auth/verify
  - Requires - { address : wallet_address, signature : signed_nonce }
  - Response - 
    - if verified then { token : jwt_signed_token }
    - else status 401

### User
- GET /user/profile
  - Requires - jwt_token on Authorization header
  - Response - all user information ( private and public )

- GET /user/profile/:username
  - Response - publicly available account info of the username

- PATCH /user/username
  - Requires - { newUsername } on req.body + jwt_token;
  - Response - { msg : Username updated to 'username', token : jwt_token }

- PATCH /user/profile
  - Requires - jwt_token and things to be updated on user profile (wallet cannot be updated)
  - Response - { msg : "Profile Updated", data : updated_data }

- PATCH /user/links
  - Requires - jwt_token and array of links to be updated as well as links that are not updated
  - Sample Request Body {
    links : [
      { sitename : "twitter", link : "https://twitter.com/blah", username : "Blah" }, 
      { sitename : "instagram", link : "https://instagram.com/blah", username : "Blah" }
    ]
  }
  - Response - { msg : "Links Updated", data : updated_links }


### Collection
- GET /collection/:collection-name
  - Response - Items in that collection and other collection information

- GET /collections/:username
  - Response - Overview of all public collections of this username

- GET /collections/:me
  - Requires - jwt_token
  - Response - Overview of all public and private collections of the user

- POST /collection
  - Requires - jwt_token, { items, collection_name } = req.body;
  - Response - msg "Collection Created" + req.body

- PATCH /collection
  - Requires - jwt_token + { editable fields } in req.body
  - Response - { edited data }

- PATCH /collection/remove
  - Requires - jwt_token + { item unique id list to be removed }
  - Response - { updated collection }

- PATCH /collection/add
  - Requires - jwt_token + { list of items to be added }
  - Response - { updated collection }

- DELETE /collection
  - Requires - jwt_token + collection_id to be deleted
  - Response - msg : "Collection Deleted"



### This "Item" part is is not done.
### Item
- GET /item/:item_id
  - Response - Publically available item data

- GET /items/:username
  - Response - overview of publicly available items of the username

- GET /items/:me
  - Require - jwt_token
  - Response - overview of public and private items

- POST /item
  - Requires - jwt_token
  - Response - msg "item created"

- PATCH /item
  - Requires - jwt_token, { item_id to be edited } in req.body
  - Response - { new item data }

- DELETE /item 
  - Requires - jwt_token + item_id to be deleted
  - Response - msg : "Item Deleted"


### Youtube
- GET /youtube/login-callback
  - Requires - jwt_token + other query params by google
  - Response -
    - If success - msg : "Account Connected"
    - Else - msg : "Account Link failed"

- GET /youtube/posts
  - Requires - jwt_token
  - Response - Channel Data + videos

- GET /youtube/refresh
  - Requires - jwt_token
  - Response - msg : "Video List Refreshed"

#### Some Instructions

- Folders that start with __ ( double underscore ) are smaller working modules.
- For downloading youtube video `npm install ytdl-core --save`
- `const fs = require('fs');`
- `const ytdl = require('ytdl-core');`
- `ytdl('http://www.youtube.com/watch?v=aqz-KE-bpKQ').pipe(fs.createWriteStream('video.mp4'));`