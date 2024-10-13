require("dotenv").config()
const discord = require("discord.js")
const fs = require("fs")
const path = require("path")

const choices = []
const serverRootFolder = path.join(path.dirname(__dirname),"versions")
const serverFolders = fs.readdirSync(serverRootFolder)

for(let folderName of serverFolders){
    choices.push({name:folderName,value:folderName})
}

if(!Boolean(choices[0])){
    choices.push({name:"[NO INSTALLATION FOUND]",value:"[PLACEHOLDER]"})
}

const SlashCommandObject = {
    //スラッシュコマンドの設定
    data:new discord.SlashCommandBuilder()
        .setName(path.basename(__filename).split(".")[0])
        .setDescription("指定した起動構成に導入されているプラグインを一覧表示します。")
        .addStringOption(option =>
            option
                .setName("version")
                .setDescription("起動構成")
                .setRequired(true)
                .addChoices(choices)
        ),


    //呼び出された時の処理
    async execute(interaction,client){

        await interaction.deferReply()

        const version = interaction.options.getString("version")

        try{

            if(version==="[PLACEHOLDER]"){
            
                const embed = new discord.EmbedBuilder()
                    .setColor("Blue")
                    .setTitle("INFO")
                    .setDescription("起動構成がインストールされていません。\n/install で起動構成を作成するか、手動でインストールを行ってください。")
                
                await interaction.followUp({embeds:[embed]})
    
            }else{
    
                const targetDir = path.join(path.dirname(__dirname),"versions",version,"plugins")

                if(fs.existsSync(targetDir)){

                    const plugins = fs.readdirSync(targetDir).filter(elem=>{elem.endsWith(".jar")})
    
                let pluginsStr = ""
    
                plugins.forEach(elem => {
                    
                    pluginsStr = pluginsStr+`${elem.split(".")[0]}\n`
    
                });
    
                if(pluginsStr===""){
                    pluginsStr = "導入されているプラグインはありません。"
                }
    
                const embed = new discord.EmbedBuilder()
                    .setColor("Blue")
                    .setTitle("PluginList")
                    .setDescription(pluginsStr)
    
                await interaction.followUp({embeds:[embed]})

                }else{

                    const embed = new discord.EmbedBuilder()
                        .setColor("Blue")
                        .setTitle("INFO")
                        .setDescription("pluginsフォルダが存在しません。")
        
                    await interaction.followUp({embeds:[embed]})

                }

            }

        }catch(err){

            const embed = new discord.EmbedBuilder()
                .setColor("Red")
                .setTitle("ERROR")
                .setDescription(err)
    
            await interaction.followUp({embeds:[embed]})

        }

    }

}

module.exports = SlashCommandObject