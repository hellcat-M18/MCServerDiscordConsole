require("dotenv").config()
const discord = require("discord.js")
const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")


const guild_id = process.env.guild_id
const app_id = process.env.app_id
const TOKEN = process.env.TOKEN

//他のコマンドの起動構成リスト更新用
async function reloadBootList(client,TOKEN,app_id){

    const commands = []

    client.commands = new discord.Collection()

    const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith(".js"))

    for(const file of commandFiles){
        const filePath = path.join(__dirname,file)
        delete require.cache[require.resolve(filePath)]
        const command = require(filePath)

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON())
            console.log(`[INFO] Successfully loaded module /${command.data.name}`)
        } else {
            console.log(`[WARNING] Failed to load module /${filePath.split("\\").slice(-1)[0].split(".")[0]}`);
        }
    }

    const rest = new discord.REST().setToken(TOKEN)

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            discord.Routes.applicationGuildCommands(app_id, guild_id),//.envで設定したギルドのみに反映
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }

}

function removeServer(interaction,targetFolder,name,client,TOKEN,app_id){

    fs.rm(targetFolder,{recursive:true},async (err)=>{

        let embed

        if(err){

            embed = new discord.EmbedBuilder()
                .setColor("Red")
                .setTitle("ERROR")
                .setDescription(err)
            
        }else{

            embed = new discord.EmbedBuilder()
            .setColor("Green")
            .setTitle("DELETE")
            .setDescription(`${name}を削除しました。`)

            reloadBootList(client,TOKEN,app_id)

        }
        
        await interaction.followUp({embeds:[embed]})
        

    })

}


const choices = []
const serverRootFolder = path.join(path.dirname(__dirname),"versions")
const serverFolders = fs.readdirSync(serverRootFolder)

for(let folderName of serverFolders){
    choices.push({name:folderName,value:folderName})
}

if(!Boolean(choices[0])){
    choices.push({name:"[NO INSTALLATION FOUND]",value:"<PLACEHOLDER>"})
}


const SlashCommandObject = {
    //スラッシュコマンドの設定
    data:new discord.SlashCommandBuilder()
        .setName(path.basename(__filename).split(".")[0])
        .setDescription("起動構成を削除します")
        .addStringOption(option=>
            option
                .setName("name")
                .setDescription("起動構成")
                .setRequired(true)
                .addChoices(choices)
        )

    ,
    //呼び出された時の処理
    async execute(interaction,client){

        await interaction.deferReply()

        const name = interaction.options.getString("name")

        if(name==="<PLACEHOLDER>"){

            const embed = new discord.EmbedBuilder()
                .setColor("Blue")
                .setTitle("INFO")
                .setDescription("起動構成が存在しません。")

            await interaction.followUp({embeds:[embed]})

        }else{

            const targetFolder = path.join(serverRootFolder,name)

            

            try {

                fs.readFile(path.join(__dirname,"working.json"),"utf-8",async (err,data)=>{

                    if(data!==""){

                        const serverInfo = JSON.parse(data)

                        const child = childProcess.exec(`taskkill /f /t /PID ${serverInfo.pid}`,async (err,stdout,stderr)=>{

                            //コールバック内は実行終了後に呼ばれる...はずなのだけれど、fs.rmをやるとフォルダが使用中判定になるのでやむなくsetTimeoutで対応
                            //ほんとはあんまりやりたくない

                            setTimeout(()=>{removeServer(interaction,targetFolder,name,client,TOKEN,app_id)},2000)

                        })
                        
                    }else{

                        await removeServer(interaction,targetFolder,name,client,TOKEN,app_id)
                        
                    }

                })     
                
            } catch (err) {
                console.log(err.toString())
                
                const embed = new discord.EmbedBuilder()
                    .setColor("Red")
                    .setTitle("ERROR")
                    .setDescription(err)

                await interaction.followUp({embeds:[embed]})

            }

            

        }
        
    }
}

module.exports = SlashCommandObject