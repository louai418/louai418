var telegram = require("node-telegram-bot-api");
var token = "6002162103:AAGrfM7-SPnpSA87eEnC8JP_-cKcBTLg14Y";
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const axios = require('axios');
const mongoose = require('mongoose');
var opt = {polling:true};
var bot = new telegram(token,opt);
const users = require("./schemas/user");
var request = require("request");
var suwarData;
const { text } = require("input");

var reciterId;
var moshaf_server="";
const rawData = fs.readFile('surah.json', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
 suwarData = JSON.parse(data);
})
const surah = require("./surah.json");


const { resolveId } = require("telegram/Utils");


bot.on("message",function(msg){
  var chatId = msg.chat.id;
  console.log(msg.text)
  if(msg.text.includes("start")){
  checkreg(msg.chat.id)
  const menuOptions = {
    reply_markup: {
        keyboard: [
          [
           "إختيار بالقارئ"
          ]
        ],
        resize_keyboard: true
    }
  }
  bot.sendMessage(chatId, 'اختر قارئ ..:\n\n' , menuOptions)
  
}else if(verifyTextInMOSHAF(msg.text)){
 // var currentUser = getUserById(chatId);
  updatemoshaf(chatId,msg.text)
  //var messagdata4 = userii.findOne({chatId:chatId})
  //console.log("number:"+messagdata4.reciterId+"s: "+ messagdata4.Moshaf)
  getMoshafServer(chatId,reciterId, msg.text)
  .then(function (serverUrl) {
    if (serverUrl) {
      console.log('Moshaf Server:', serverUrl);
      moshaf_server=serverUrl;
      updatemoshafServer(chatId,serverUrl)
    //  menuSuwar(chatId,reciterId,)
    } else {
      console.log('Moshaf not found');
    }
  });
}else if(msg.text ==  "إختيار بالقارئ"){
  reciterChoice(chatId)
}else if(msg.text.toLowerCase() ==  "main menu"){
  const menuOptions = {
    reply_markup: {
        keyboard: [
          [
           "إختيار بالقارئ"
          ]
        ],
        resize_keyboard: true
    }
  }
  bot.sendMessage(chatId, 'اختر قارئ ..:\n\n' , menuOptions)
  
}else{
  sendMoshafMenu(msg.text, chatId)
  
  
  getSurahIdByName(msg.text, (err, id) => {
    if (err) {
      console.error(err);
    } else {
      updatesurah(msg.chat.id,msg.text)
      updatesurahId(msg.chat.id,id)
      if(id<=9){
        id.toString();
        id="00"+id
        
      }else if(id<=99){
        id.toString();
        id="0"+id
    
      }
      var currentUser = getUserById(chatId);
      const urI =moshaf_server + id+'.mp3'
      verifyFileSize(urI.toString())
    .then((isGreaterThan20MB) => {
    console.log(isGreaterThan20MB);
    if(!isGreaterThan20MB){
      bot.sendAudio(chatId,moshaf_server+id+'.mp3');
    }else{
      verifyFileSize50(urI.toString())
      .then((isGreaterThan50MB) => {
        console.log(isGreaterThan50MB);
    if(!isGreaterThan50MB){
      request.get(urI.toString())
  .on('error', (error) => {
    console.error(error);
  })
  .pipe(fs.createWriteStream('audio.mp3'))
  .on('finish', () => {
      bot.sendAudio(msg.chat.id, fs.createReadStream('audio.mp3'),{title:msg.text});
  })

    }else{
      bot.sendMessage(chatId, 'The file size is greater than 50MB.');
      // request.get(urI.toString())
      // .on('error', (error) => {
      //   console.error(error);
      // })
      // .pipe(fs.createWriteStream('audio.mp3'))
      // .on('finish', () => {
      //   const inputFilePath = 'audio.mp3';
      //   const outputFilePath = 'audio_compressed.mp3';
      //   const targetBitrate = '16k';
        
      //   reduceAudioFileSize(inputFilePath, outputFilePath, targetBitrate)
      //     .then(() => {
      //       console.log('Audio file compressed successfully');
      //       if(!verifyFileSize50path(outputFilePath)){
      //       bot.sendAudio(chatId,'outputFilePath0')
      //     }else{
      //       bot.sendMessage(chatId,'GREAT THEN 50MB')
      //     }
      //     })
      //     .catch((error) => {
      //       console.error('Error compressing audio file:', error);
      //     });
      //    // bot.sendAudio(msg.chat.id, fs.createReadStream('audio.mp3'),{title:msg.text});
      // })

    }
  });
  
        
      
    }
  })
  .catch((error) => {
    console.error('Error:',error);
   
  });
      console.log(`ID of ${msg.text}: ${moshaf_server}${id}`);
   
    }
  });
  
  
  
 // bot.sendMessage(chatId,"سورة"+msg.text)
}

})
 
bot.on('callback_query', (query) => {
 
});

function sendMoshafMenu(reciterName, chatId) {
  axios.get('https://www.mp3quran.net/api/v3/reciters?language=ar')
    .then(function (response) {
      const reciters = response.data.reciters;
      const reciter = reciters.find((r) => r.name === reciterName);
      if (reciter) {
        updatereciter(chatId,reciterName)
        const moshafList = reciter.moshaf;
        const moshafNames = moshafList.map((moshaf) => moshaf.name);

        // Create the menu options dynamically based on the moshaf names
        const menuOptions = {
          reply_markup: {
            keyboard:  [[{ text: 'main menu' }]].concat(moshafNames.map((name) => [{ text: name }])),
            resize_keyboard: true
          }
          
        };

        // Send the menu to the chat
        bot.sendMessage(chatId, 'Please select a moshaf:', menuOptions)
          .then(() => {
            console.log('Menu sent successfully');
            const reciter = reciters.find((r) => r.name === reciterName);
           reciterId = reciter ? reciter.id : null;
           updatereciteriD(chatId,reciterId)
            console.log('Reciter ID:', reciterId);
          })
          .catch((error) => {
            console.error('Error sending menu:', error);
          });
      } else {
        console.log('Reciter not found');
      }
    })
    .catch(function (error) {
      console.error('Error retrieving reciters:', error);
    });
}

function reciterChoice(chatId) {
  axios.get('https://www.mp3quran.net/api/v3/reciters?')
    .then(function (response) {
      const data = response.data;
      const reciters = data.reciters;

      // Create the menu options dynamically based on the "name" property
      const menuOptions = {
        reply_markup: {
          keyboard: [
            [{ text: 'Main Menu' }],
            ...splitRecitersIntoRows(reciters, 2)
          ],resize_keyboard: true
        }
      };

      bot.sendMessage(chatId, 'Please select a reciter:', menuOptions);
    })
    .catch(function (error) {
      console.error('Error fetching data:', error);
    });
}

// Helper function to split reciters into rows
function splitRecitersIntoRows(reciters, recitersPerRow) {
  const menuKeyboard = [];
  let row = [];

  reciters.forEach((reciter) => {
    row.push({ text: reciter.name });

    if (row.length === recitersPerRow) {
      menuKeyboard.push(row);
      row = [];
    }
  });

  if (row.length > 0) {
    menuKeyboard.push(row);
  }

  return menuKeyboard;
}

function menuSuwar(chatId,reciterId,moshafSurahList){
  axios.get(`https://www.mp3quran.net/api/v3/reciters?language=ar&reciter=${reciterId}`)
  .then(function (response) {
    const data = response.data;
    const surahListArray = moshafSurahList.split(',').map(Number);

   bot.sendMessage(chatId, 'Surah List for the Moshaf:\n\n' + surahListArray.join(', '))
  .then(() => {
    console.log('Surah list sent successfully');
  })
  .catch((error) => {
    console.error('Error sending surah list:', error);
  });

  fs.readFile('surah.json', 'utf8', (error, jsonData) => {
    if (error) {
        console.error('Error reading surah JSON file:', error);
        return;
    }

    // Parse the JSON data
    const data = JSON.parse(jsonData);

    // Example surah list array

    // Retrieve the surah names
    const surahNames = surahListArray.map((surahId) => {
        
        const surah = data.suwar.find((s) => s.id === surahId);
        return surah ? surah.name.trim() : '';
   
    
    });
    const menuKeyboard = [];
    let line = [];
    surahNames.forEach((name, index) => {
        line.push({ text: name });
        if ((index + 1) % 4 === 0 || index === surahNames.length - 1) {
            menuKeyboard.push(line);
            line = [];
        }
    });
    menuKeyboard.unshift([{ text: 'Main Menu' }])
    const menuOptions2 = {
        reply_markup: {
            keyboard: menuKeyboard,
            resize_keyboard: true
        }
        
    };


    bot.sendMessage(chatId, 'Surah Names:\n\n' , menuOptions2)
        .then(() => {
            console.log('Surah names sent successfully');
        })
        .catch((error) => {
            console.error('Error sending surah names:', error);
        });
});
   


  });
  

}

function getMoshafServer(chatId,reciterId, moshafName) {
  const apiUrl = `https://www.mp3quran.net/api/v3/reciters?language=ar&reciter=${reciterId}`;
  return axios
    .get(apiUrl)
    .then(function (response) {
      const data = response.data;
      const reciter = data.reciters[0];
      console.log('api '+apiUrl)
      if (reciter) {
        const moshaf = reciter.moshaf.find((m) => m.name === moshafName);
        if (moshaf) {
          menuSuwar(chatId,reciterId,moshaf.surah_list)
          console.log('server '+moshaf.surah_list)
          return moshaf.server;
        }
      }
      return null;
    })
    .catch(function (error) {
      console.error('Error fetching data:', error);
      return null;
    });
}

// Example usage



function getSurahIdByName(surahName, callback) {
  // Read the JSON file
  fs.readFile('surah.json', 'utf8', (err, data) => {
    if (err) {
      callback(err, null);
      return;
    }

    // Parse the JSON data
    const suwarData = JSON.parse(data);

    // Find the surah by name
    const surah = suwarData.suwar.find((s) => s.name.trim() === surahName.trim());

    if (surah) {
      callback(null, surah.id);
    } else {
      callback(`Surah ${surahName} not found.`, null);
    }
  });
}

function verifyTextInMOSHAF(text) {
  // Read the JSON file
  const jsonData = fs.readFileSync('moshaf.json', 'utf8');

  try {
    // Parse the JSON data
    const moshafData = JSON.parse(jsonData);

    // Check if the text exists in the "name" field
    const exists = moshafData.some((item) => item.name === text);

    return exists;
  } catch (error) {
    console.error('Error parsing JSON file:', error);
    return false;
  }
}

async function verifyFileSize(url) {
  try {
    const response = await axios.head(url);
    const contentLength = response.headers['content-length'];
    const fileSizeInMB = contentLength / (1024 * 1024);
    console.log('verifyFileSize'+url)

    return fileSizeInMB > 20;
  } catch (error) {
    console.error('Error verifying file size:');
    return false;
  }
}


async function verifyFileSize50(url) {
  try {
    const response = await axios.head(url);
    const contentLength = response.headers['content-length'];
    const fileSizeInMB = contentLength / (1024 * 1024);
    console.log('verifyFileSize'+url)

    return fileSizeInMB > 50;
  } catch (error) {
    console.error('Error verifying file size:');
    return false;
  }
}

async function verifyFileSize50path(filePath) {
  try {
    const stats = await fs.promises.stat(filePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
    console.log('Verifying file size:', filePath);
    console.log('File size:', fileSizeInMB, 'MB');

    return fileSizeInMB > 50;
  } catch (error) {
    console.error('Error verifying file size:', error);
    return false;
  }
}

mongoose.connect('mongodb+srv://new_louaytlgrm:louai123@cluster0.rj3qf.mongodb.net/telegramDb?retryWrites=true&w=majority',{
    useNewUrlParser: true,
     useUnifiedTopology: true
 }).then(()=>{
     console.log('connected to the DB ')
 }).catch((err)=>{
     console.log(err)
     console.log('not connected to the DB ')
 })

async function adduser(senderid){
        
         await  users.create(({
          chatId : senderid
        }
          )).then(()=>bot.sendMessage(senderid,"welcome"))
      }

      async function checkreg(senderid){
        
        var messagdata =await users.findOne({chatId:senderid})
        if(!messagdata){
         await adduser(senderid)
        }else{
          console.log("already")
        }
       }

       function updatesurah(senderid,name){
              users.findOne({ chatId: senderid })
              .then((document) => {
                // Update the fields of the document
                document.surah = name;
                //document.field2 = 42;
                // ...

                // Save the updated document
                return document.save();
              })
              .then(() => {
                console.log('Document updated successfully');
              })
              .catch((err) => {
                console.error('Error updating document', err);
              });

       }


       function updatemoshaf(senderid,name){
        users.findOne({ chatId: senderid })
        .then((document) => {
          // Update the fields of the document
          document.Moshaf = name;
          //document.field2 = 42;
          // ...

          // Save the updated document
          return document.save();
        })
        .then(() => {
          console.log('Document updated successfully');
        })
        .catch((err) => {
          console.error('Error updating document', err);
        });

 }
       function updatemoshafServer(senderid,name){
        users.findOne({ chatId: senderid })
        .then((document) => {
          // Update the fields of the document
          document.MoshafServer = name;
          //document.field2 = 42;
          // ...

          // Save the updated document
          return document.save();
        })
        .then(() => {
          console.log('Document updated successfully');
        })
        .catch((err) => {
          console.error('Error updating document', err);
        });

 }

 function updatereciter(senderid,name){
  users.findOne({ chatId: senderid })
  .then((document) => {
    // Update the fields of the document
    document.reciter = name;
    //document.field2 = 42;
    // ...

    // Save the updated document
    return document.save();
  })
  .then(() => {
    console.log('Document updated successfully');
  })
  .catch((err) => {
    console.error('Error updating document', err);
  });

}


function updatereciteriD(senderid,name){
  users.findOne({ chatId: senderid })
  .then((document) => {
    // Update the fields of the document
    document.reciterId = name;
    //document.field2 = 42;
    // ...

    // Save the updated document
    return document.save();
  })
  .then(() => {
    console.log('Document updated successfully');
  })
  .catch((err) => {
    console.error('Error updating document', err);
  });

}
function updatesurahId(senderid,name){
  users.findOne({ chatId: senderid })
  .then((document) => {
    // Update the fields of the document
    document.surahId = name;
    //document.field2 = 42;
    // ...

    // Save the updated document
    return document.save();
  })
  .then(() => {
    console.log('Document updated successfully');
  })
  .catch((err) => {
    console.error('Error updating document', err);
  });

}

function getUserById(userId) {
  users.findOne({ chatId: userId })
    .then((user) => {
      if (user) {
        console.log('User found:', user);
        return user;
      } else {
        console.log('User not found');
        checkreg(userId)
      }
    })
    .catch((error) => {
      console.error('Error retrieving user:', error);
    });
}

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

function reduceAudioFileSize(inputFilePath, outputFilePath, targetBitrate, preset) {
  return new Promise((resolve, reject) => {
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg(inputFilePath)
      .audioCodec('libmp3lame')
      .audioBitrate(targetBitrate)
      .addOutputOption('-preset', 'fast')
      .on('error', (error) => {
        console.error('An error occurred:', error.message);
        reject(error);
      })
      .on('end', () => {
        console.log('Audio compression complete');
        resolve();
      })
      .save(outputFilePath);
  });
}

// Usage example
