require("dotenv").config()
const discord = require("discord.js")
const fs = require("fs")
const path = require("path")

const guild_id = process.env.guild_id
const app_id = process.env.app_id
const TOKEN = process.env.TOKEN

//全コマンドのリロード。起動構成の更新時なんかに走らせる。
async function reload(interaction,client,TOKEN,app_id){

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

    /*
    読み込みなおしたコマンドの情報を投げている。
    client.commands.set() で更新できると公式ドキュメントにはあるが上手くいかないので苦肉の策。
    */

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // const empty = await rest.put(
        //     discord.Routes.applicationGuildCommands(app_id, guild_id),
        //     { body: [] },
        //     );

        const data = await rest.put(
            discord.Routes.applicationGuildCommands(app_id, guild_id),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);

        const embed = new discord.EmbedBuilder()
            .setColor("Green")
            .setTitle("RELOAD")
            .setDescription(`${data.length}個のコマンドをリロードしました。`)

        await interaction.followUp({embeds:[embed]})

    } catch (error) {
        console.error(error);
    }

}


const SlashCommandObject = {
    //スラッシュコマンドの設定
    data:new discord.SlashCommandBuilder()
        .setName(path.basename(__filename).split(".")[0])
        .setDescription("各種コマンドをリロードします。")

    ,
    //呼び出された時の処理
    async execute(interaction,client){

        await interaction.deferReply()

        reload(interaction,client,TOKEN,app_id)
        
    }
}

module.exports = SlashCommandObject