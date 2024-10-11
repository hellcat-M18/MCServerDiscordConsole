//discord
const discord = require("discord.js")
const { Client, GatewayIntentBits } = require('discord.js');

//dotenv
require('dotenv').config();

//fs
const fs = require("fs")
const path = require("path")

//REST
const { REST, Routes } = require('discord.js');
const childProcess = require("child_process");


//Intentsの設定
const client = new Client({intents:[GatewayIntentBits.Guilds]})


//環境変数の読み込み
const TOKEN = process.env.TOKEN
const app_id = process.env.app_id
const server_address = process.env.server_address
const server_port = process.env.server_port

const guild_id = process.env.guild_id
const log_channel_id = process.env.log_channel_id
const permisson_role_id = process.env.permisson_role_id
const permission_user_id = process.env.permission_user_id


//その他変数
const commands = []

//起動時にPIDをリセット
fs.writeFileSync(path.join(__dirname,"commands","working.json"),"",()=>{})

//存在しなければVersionsフォルダを作る
fs.mkdirSync("versions",{recursive:true},(err)=>{})


//起動ログ
client.once("ready",()=>{
    console.log(`Logged in as ${client.user.tag}`)
})


//スラッシュコマンドの読み込み
client.commands = new discord.Collection()

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"))

for(const file of commandFiles){
    const filePath = path.join(__dirname,"./commands",file)
    const command = require(filePath)

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON())
		console.log(`[INFO] Successfully loaded module /${command.data.name}`)
    } else {
        console.log(`[WARNING] Failed to load module /${filePath.split("\\").slice(-1)[0].split(".")[0]}`);
    }
}

//スラッシュコマンドのハンドリング
client.on("interactionCreate", async interaction => {
    if(!interaction.isChatInputCommand){return}

    const command = interaction.client.commands.get(interaction.commandName)

    try {
		await command.execute(interaction,client);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}

})

//スラッシュコマンドの登録
const rest = new REST().setToken(TOKEN)

async function refreshCommands(){
    try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		//コマンドの更新処理
		const data = await rest.put(
			Routes.applicationGuildCommands(app_id, guild_id),//.envで設定したギルドのみに反映
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
}

refreshCommands()


//ログイン
client.login(TOKEN)


//終了時に鯖を一緒に落とす
function cleanup() {
	const data = fs.readFileSync(path.join(__dirname,"commands","working.json"),"utf-8",(err,data)=>{
		const pid = JSON.parse(data).pid
		childProcess.exec(`taskkill /f /PID ${pid}`)
	})
}

// SIGINT（Ctrl+C）をキャッチ
process.on('SIGINT', () => {
	console.log('SIGINTシグナルを受信しました。');
	cleanup();
	process.exit(0); // 正常終了
  });
  
  // SIGTERMをキャッチ
  process.on('SIGTERM', () => {
	console.log('SIGTERMシグナルを受信しました。');
	cleanup();
	process.exit(0); // 正常終了
  });