// const url = "mongodb://127.0.0.1:27017";
// const client = new MongoClient(url);

// async function connectDB(){
//     try {
//         await client.connect();
//         console.log("MongoDB connected successsfully")
//     } catch (error){
//         console.log("connection Error: ",error);
//     } finally{
//         await client.closed();
//     }
// }

// connectDB();

const {MongoClient} = require("mongodb");

const url = "mongodb:127.0.0.1:27017";

const client = new MongoClient(url);

async function connectDB(){
    await client.connect();
    console.log("MongoDB connected!");
    const db = client.db("collehgeDB");
    const collection = db.collection("students");
    const result = await collection.insertOne({
        name : "akhil" ,
        age : "18" ,
        course : "scds" ,
        city : "chennai" ,
    });
    console.log("student inserted successfully!");
    console.log("inserted id : ",result.insertedid);
    const (error) {
        console.error("ERROR DETAILS:",error)
    }finally{
        await client.closed();
        
    }
}       
connectDB();
db.students.insertmany([
    {
        name: "priya",
        age : "26",
        course: "mtech",
        city : "chennai",
    },
    {
        name : "santosh",
        age : "19",
        course : "cse",
        city : "yaragadda"
    }
])
