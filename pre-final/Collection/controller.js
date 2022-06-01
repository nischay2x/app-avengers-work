const Collection = require('../models/collection.js');
const User = require('../models/user.js');
const jwt = require('jsonwebtoken');
const CONFIG = require('../config.js');

async function getCollectionBySlug(req, res){
    const { slug } = req.params;
    const { wallet } = req.user;
    try {
        const collection = await Collection.findOne({"slug" : slug}).populate("walletmap");
        if(collection.name){
            return res.status(200).json({
                data : {
                    name : collection.name,
                    slug : collection.slug,
                    owner : { 
                        username : collection.owner.username,
                        wallet : collection.owner._id
                    },
                    items : collection.items,
                    createdAt : collection.createdAt,
                    image : collection.image,
                    banner : collection.banner,
                    description : collection.description,
                    external_link : collection.external_link
                },
                edit_token : collection.is_public? "" : (collection.owner._id === wallet) ? jwt.sign({ id : collection._id, wallet : wallet }, CONFIG.collectionTokenSecret) : ""
            });
        } else {
            return res.status(200).json({ data : {}});
        }
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
}

async function getCollectionsByUsername(req, res){
    const { username } = req.params;
    try {
        const { collections, username, wallet } = await User.findOne(username, { "collections" : 1 }).populate('collections')
        let coll = [];
        collections.forEach(col => {
            if(col.is_public){
                coll.push({
                    name : coll.name,
                    slug : coll.slug,
                    image : coll.image,
                    banner : coll.banner,
                    itemCount : Object.keys(coll.items).length
                })
            }
        })
        return res.status(200).json({
            data : {
                "collections" : coll,
                "userame" : username,
                "wallet" : wallet
            }
        });
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
}

async function getMyCollections(req, res){
    const { wallet, username } = req.user;
    let uid = username ? username : wallet;
    try {
        const { collections, username, wallet } = await User.findById(uid, {
            collections : 1, username : 1, wallet : 1
        }).populate('collections');
        collections.map(col => {
            return {
                name : col.name,
                slug : col.slug,
                image : col.image,
                banner : col.banner,
                itemCount : Object.keys(col.items).length
            }
        });
        return res.status(200).json({
            data : {
                collections : collections.map(col => {
                    return {
                        name : col.name,
                        slug : col.slug,
                        image : col.image,
                        banner : col.banner,
                        itemCount : Object.keys(col.items).length,
                        created : col.createdAt,
                        updated : col.updatedAt
                    }
                }),
                username : username,
                wallet : wallet
            }
        })
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
}

async function createCollection(req, res){
    const { wallet, username } = req.user;
    const uid = username ? userame : wallet;
    const { 
        items, name, image, banner, 
        description, external_link, visibility
    } = req.body;
    try {
        const slug = `${name.split(/\s+/).join("-")}-${new Date().getTime()}`;
        let itemObject = {};
        items.forEach(itm => {
            itemObject[itm.key] = itm; 
        })
        const newCollection = await new Collection({
            "name" : name,
            "slug" : slug,
            "items" : itemObject,
            "image" : image,
            "banner" : banner,
            "description" : description,
            "owner" : wallet,
            "external_link" : external_link,
            "is_public" : visibility
        });
        await newCollection.save();
        await User.findByIdAndUpdate(uid, {
            $push : { "collections" : newCollection._id }
        });
        return res.status(200).json({
            data : {
                ...req.body,
                "slug" : slug
            },
            edit_token : jwt.sign({ id : newCollection._id, wallet : wallet }, CONFIG.collectionTokenSecret)
        });
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
}

async function editCollection(req, res){
    const { id } = req.collection;
    const { updates } = req.body;
    try {
        await Collection.findByIdAndUpdate(id, {
            $set : updates
        });
        return res.status(200).json({ data : updates })
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
}

async function addToCollection(req, res){
    const { id } = req.collection;
    const { items } = req.body;
    try {
        let update = { "items" : {} }
        items.forEach(itm => {
            update.items[itm.key] = itm;
        });
        const updated = await Collection.findByIdAndUpdate(id, {
            $set : update
        }, { new : true });
        return res.status(200).json({
            data : {
                items : updated.items
            }
        });
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
}

async function removeFromCollection(req, res){
    const { id } = req.collection;
    const { itemIds } = req.body;
    try {
        let update = { "items" : {} }
        itemIds.forEach(itm => {
            update.items[itm] = itm;
        });
        const updated = await Collection.findByIdAndUpdate(id, {
            $unset : update
        }, { new : true })
        return res.status(200).json({
            data : { items : updated.items }
        });
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
}

module.exports = {
    getCollectionBySlug
}
