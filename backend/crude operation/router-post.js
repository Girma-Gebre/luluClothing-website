require('dotenv').config(); // to config the .env file 
const express = require("express");
const mongoose = require('mongoose'); 
const router = express.Router();
const Autoincrement = require("mongoose-sequence")(mongoose); // import the autoincrement as-built module
// connect the serer (node Js) with mongoDB atlas
mongoose.connect(process.env.MONGO_URL, {family: 4})
.then(()=>console.log("Conneted to MongoDB Atlas"))
.catch(err=>console.error('Connection failed', err)) 


// create schema
const luluClothSchema = new mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true},    
    service: {type: String, required: true},    
    message: {type: String, required: true}    
});  

 //---------insert "User_id" field and make autoincrement for each data inserted from client/fromtend-------
//--------inc_field is plugin expexted object key
// ---- Always apply the plugin before creating the model:
luluClothSchema.plugin(Autoincrement, {inc_field: "luluclothingID"}); 
// creating "luluclothingID" field in the collection of "counter" in the mongoDB atlas to auto increment the value of "luluclothingID" for each document inserted in the "luluclothings" collection in monngoDB database. This is the identification name for each database document.
const luluClothing = mongoose.model("luluClothing", luluClothSchema); 
// This is making "luluClothing" collection in the mongoDB database and the noame of the collection is the same as the model name but in lowercase and plural form by defualt.
async function resetCounterIfEmpty() {
  const count = await luluClothing.countDocuments(); // this shows the valoue of seq in counters collection it indicates the heighest "sideJobID" or the number of documents in the "sidejobs" collection in mongoDB database
  if (count === 0) {
    // Reset the counter for "UserId"
    await mongoose.connection.collection("luluClothingSResetSeq").updateOne( // SideJobCounter is the name of the database collection in mongoDb atlas use to reset the value of "sideJobID" for each document in the "sidejpbs" database collection in mongoDb atlas if we remove the document with the "id: sideJobID" from "counters" database, it (counters) is created automathically when the client insert at first time.
      { _id: `${luluClothing.collection.name}_UserID` }, // to indicate the name of the collection and its field name. 
      { $set: { seq: 0 } },
      { upsert: true } // insert if it is not exist update if it is exixt
    );
  }
}

router.post("/luluclothing", async (req,res)=>{
    try{
    const firstNameNoExtraSpace = req.body.firstName.trim().replace(/\s+/g, " "); //avoiding extra space from firstName from client/frontend  
    const lastNameNoExtraSpace = req.body.lastName.trim().replace(/\s+/g, " "); //avoiding extra space from lastName from client/frontend  
    const {email, service, message} = req.body;
    // find the email or name
    const existingData = await luluClothing.findOne({
         $or: [
               {
                $and: [
                {firstName: {$regex: `^${firstNameNoExtraSpace}$`, $options: "i" }},
                {lastName: {$regex: `^${lastNameNoExtraSpace}$`, $options: "i" }}
                     ]
                },
                {email: email}
             ]
             });

    if (existingData) {
      const sameFirstName = existingData.firstName.toLowerCase() === firstNameNoExtraSpace.toLowerCase();
      const sameLastName = existingData.lastName.toLowerCase() === lastNameNoExtraSpace.toLowerCase();
      const sameEmail = existingData.email === email

     if (sameFirstName && sameLastName) {
      return res.json({ Msg: "Your full name is already exist!" });
      } else if (sameEmail) {
      return res.json({ Msg: "Your email is already exists!" });
      }
     }
        
        await resetCounterIfEmpty() //calling the function to reset the "UserId"
      // create an instance object template from class and insert data from client e.g: req.body
        const newLuluClothing = new luluClothing({firstName: firstNameNoExtraSpace,lastName: lastNameNoExtraSpace, email, service, message}); // creating object from class
       await newLuluClothing.save(); // enable the data to save by mongoose and send to mongoDB as BJSON data type.
        res.status(200).json({ Msg: "Data is submitted successfully" }); // ✅send JSON this is manadatory to work the front end correctly nice!
           
    }catch(err){
      console.log(err);
        res.status(500).json({Msg: "internal server error or problem on database connection"});
    }
});

module.exports = router;  