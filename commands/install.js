require("dotenv").config()
const discord = require("discord.js")
const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")

const request = require("request")

const guild_id = process.env.guild_id
const app_id = process.env.app_id
const TOKEN = process.env.TOKEN

const Xms = process.env.Xms
const Xmx = process.env.Xmx

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

        // const empty = await rest.put(
        //     discord.Routes.applicationGuildCommands(app_id, guild_id),//.envで設定したギルドのみに反映
        //     { body: [] },
        //     );

        const data = await rest.put(
            discord.Routes.applicationGuildCommands(app_id, guild_id),//.envで設定したギルドのみに反映
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }

}

//インストール可能なランチャー
const types = [
    {name:"Vanilla",value:"vanilla"},
    {name:"Forge",value:"forge"},
    {name:"Fabric",value:"fabric"},
    {name:"Paper",value:"paper"},
    
]

function streamToPromise(stream) {
    return new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

function isInvalidName(str){

    const invalidChars = /[<>:"/\\|?*]/

    return invalidChars.test(str)

}

const SlashCommandObject = {
    //スラッシュコマンドの設定
    data:new discord.SlashCommandBuilder()
        .setName(path.basename(__filename).split(".")[0])
        .setDescription("指定された形式のサーバーをインストールします。")
        .addStringOption(option=>
            option
                .setName("launcher")
                .setDescription("ランチャー")
                .setRequired(true)
                .addChoices(types)
        )
        
        .addStringOption((option)=>
            option
                .setName("version")
                .setDescription("バージョン")
                .setRequired(true)
        )
        
        .addStringOption((option)=>
            option
                .setName("name")
                .setDescription("起動構成名")
                .setRequired(true)
        ),


    //呼び出された時の処理
    async execute(interaction,client){
        
        await interaction.deferReply()

        const launcher = interaction.options.getString("launcher")
        const version = interaction.options.getString("version")
        const name = interaction.options.getString("name")

        if(isInvalidName(name)){

            const embed = new discord.EmbedBuilder()
                .setColor("Red")
                .setTitle("ERROR")
                .setDescription("ファイル名に使えない記号が含まれています。")

            await interaction.followUp({embeds:[embed]})

        }else{

            const logChannel = client.channels.cache.get(process.env.log_channel_id)        

            const targetFolder = path.join(path.dirname(__dirname),"versions",name)

            try {
                
                if(!fs.existsSync(targetFolder)){
                    //mcutilsから.jarを引っ張ってくる
                    //本当なら公式配布のランチャー使いたいけどAPIの構造的に叩ける気がしないので断念
                    const url = `https://mcutils.com/api/server-jars/${launcher}/${version}/download`

                    let progress = new discord.EmbedBuilder()
                        .setColor("Blue")
                        .setTitle("PROGRESS")
                        .setDescription("Creating folder...")
        
                    await interaction.editReply({embeds:[progress]})
                    
                    //インストール先の作成
                    await fs.mkdir(targetFolder, { recursive: true },()=>{})
                    await fs.writeFile(path.join(path.dirname(__dirname),"versions",name,"server.jar"),"",()=>{})
                    
                    progress.setDescription("Downloading...")
                    await interaction.editReply({embeds:[progress]})
        
                    const writeStream = fs.createWriteStream(path.join(targetFolder,"server.jar"))
        
                    const req = request(url)
                    //存在確認
                    req.on("response",async (response)=>{
        
                        if(response.statusCode == 200){
                            //空の.jarに書き込み
                            req.pipe(writeStream)
        
                            await streamToPromise(writeStream)
        
                            progress.setDescription("Extracting...")
                            await interaction.editReply({embeds:[progress]})

                            let options 
                            
                            switch (launcher) {
                                case "vanilla":
                                case "paper":
                                    options = "-jar server.jar"
                                    break;
                                
                                case "forge":
                                    options = "-jar server.jar nogui --installServer"
                                    break;
                                
                                case "fabric":
                                    options = "-jar server.jar server"
                                    break;
                            }                    
                            
                            //.jar実行
                            const child = childProcess.spawn("java",options.split(" "),{cwd:targetFolder})
        
                            child.stdout.on("data",async (chunk)=>{
        
                                if(Boolean(logChannel)){logChannel.send(`\`${chunk.toString()}\``)}
        
                            })
        
                            child.stderr.on("data",async (chunk)=>{
        
                                if(Boolean(logChannel)){logChannel.send(`\`${chunk.toString()}\``)}

                            })
                            
                            child.on("close",async ()=>{
        
                                progress.setDescription("Setting...")
                                await interaction.editReply({embeds:[progress]})
        
                                fs.writeFile(path.join(targetFolder,"eula.txt"),"eula=true",async ()=>{
                                    //Vanilla, Paper, Fabricは多分run.batを作らないので自分で作る
                                    if(launcher=="vanilla"||launcher=="paper"||launcher=="fabric"){

                                        fs.writeFile(path.join(targetFolder,"run.bat"),`java -Xms${Xms} -Xmx${Xmx} -jar server.jar`,()=>{})
        
                                    }else{
                                        if(launcher=="forge"){
                                            fs.writeFile(path.join(targetFolder,"user_jvm_args.txt"),`-Xms${Xms} -Xmx${Xmx}`,()=>{})
                                        }
                                    }
        
                                    const embed = new discord.EmbedBuilder()
                                        .setColor("Green")
                                        .setTitle("INSTALL")
                                        .setDescription(`**Launcher:${launcher}**\n**Version:${version}**\nの構成をインストールしました。`)
        
                                    await interaction.editReply({embeds:[embed]})

                                    await reloadBootList(interaction.client,TOKEN,app_id)
        
                                })
                                
                                
                            })
        
                        }else{
        
                            req.abort()
                            
                            fs.rm(path.join(path.dirname(__dirname),"versions",name),{recursive:true},()=>{})
        
                            const embed = new discord.EmbedBuilder()
                                .setColor("Red")
                                .setTitle("ERROR")
                                .setDescription("指定されたバージョンは存在しません。")
        
                            await interaction.followUp({embeds:[embed]})
                        
                        }
                    })

                    req.on("error",(err)=>{
                        console.log("[RequestError]"+err)
                        writeStream.close()
                    })
        
                }else{
        
                    const embed = new discord.EmbedBuilder()
                        .setColor("Blue")
                        .setTitle("INFO")
                        .setDescription("既に同名の起動構成が存在します")
        
                    await interaction.followUp({embeds:[embed]})
        
                }

            } catch (error) {

                console.log(error)

                const embed = new discord.EmbedBuilder()
                    .setColor("Red")
                    .setTitle("ERROR")
                    .setDescription(error)

                await interaction.followUp({embeds:[embed]})
                
            }

        }

    }
}

module.exports = SlashCommandObject