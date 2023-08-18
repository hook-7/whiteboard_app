//   出口部分~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const BrightMapping = [0, 8, 11, 14, 16, 18, 20, 21, 23, 24, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 40, 44, 48, 51,
	54, 57, 60, 62, 65, 67, 70, 72, 74, 77, 79, 81, 85, 88, 92, 95, 99, 102, 105, 108, 111, 114, 117, 120, 122, 125,
	128, 130, 133, 135, 137, 140, 142, 144, 146, 149, 151, 153, 155, 157, 159, 161, 163, 165, 167, 169, 171, 173,
	175, 177, 179, 180, 182, 184, 186, 187, 189, 191, 193, 194, 196, 198, 199, 201, 202, 204, 206, 207, 209, 210,
	212, 213, 215, 216, 218, 219, 221, 222, 224, 225, 227, 228, 230, 231, 232, 234, 235, 236, 238, 239, 241, 242,
	243, 245, 246, 247, 249, 250, 251, 252, 254, 255
]

const cctBrightMapping = [0, 2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 51, 53, 56, 58,
	61, 63, 66, 68, 71, 73, 76, 79, 81, 84, 86, 89, 91, 94, 96, 99, 102, 104, 107, 109, 112, 114, 117, 119, 122,
	124, 127, 130, 132, 135, 137, 140, 142, 145, 147, 150, 153, 155, 158, 160, 163, 165, 168, 170, 173, 175, 178,
	181, 183, 186, 188, 191, 193, 196, 198, 201, 204, 206, 209, 211, 214, 216, 219, 221, 224, 226, 229, 232, 234,
	237, 239, 242, 244, 247, 249, 252, 255
]

const time2hex = (DelayTime) => {
	if (DelayTime > 0xff >> 1) {
		return (DelayTime / 60) << 1 ^ 1
	} else {
		return DelayTime << 1
	}
}


function hexToBytes(hexStr) {
	let str = hexStr.replace(/\s/g, "").toLowerCase();

	if (str.length % 2 !== 0) {
		throw new Error("err: data error");
	}

	let bytes = [];

	for (let i = 0; i < str.length; i += 2) {
		let hexByte = str.substr(i, 2);
		let decimalByte = parseInt(hexByte, 16);
		bytes.push(decimalByte);
	}

	return bytes;
}

function checksum(data) {
	data = hexToBytes(data);
	let end = data[3] + 4;
	let sum = 0;
	for (let i = 2; i < end; i++) {
		sum += data[i] & 0xff;
	}

	let high = sum & 0xff;
	let low = sum >> 8;
	return int2hex(~(high + low) & 0xff);
}

function int2hex(num) {
	return num.toString(16).toUpperCase().padStart(2, "0");
}

function isValidHexadecimal(str) {
	const regex = /^([0-9A-Fa-f]{2}\s[0-9A-Fa-f]{2})$/g;
	return regex.test(str.toString);
}

const numFormat = (numOrHex) => {
	const originalValue = numOrHex.toString();
	if (originalValue.indexOf(' ') !== -1) {
		return originalValue;
	} else {
		const numValue = parseInt(originalValue);
		if (!isNaN(numValue)) {
			const hexString = numValue.toString(16).toUpperCase();
			const paddedHexString = hexString.padStart(4, "0");
			return `${paddedHexString.slice(0, 2)} ${paddedHexString.slice(2)}`;
		} else {
			throw new Error("Conversion failed: Input is not a valid number.");
		}
	}
};

function init(cmd) {
	return {
		head: "47 53",
		CMD: "10",
		size: null,
		dBm: "00",
		uuid: "00 00 00 00 00 00",
		opc: "80",
		usbId: "01 FE",
		dataCmd: null,
		code: cmd.code || "",
		deviceName: cmd.deviceName || "",
		area: numFormat(cmd.area) || "",
		address: numFormat(cmd.address) || "",
		action: cmd.action || "",
		params: cmd.params || "",
		identity: cmd.identity || "",
	};
}

let req = 0;

const getReq = () => {
	req = (req + 1) % 256;
	return int2hex(req);
}

const ScenarioFactory = (scene) => {
	console.log(scene);
	return [
		int2hex(scene.SceneNo),
		int2hex(BrightMapping[scene.HighBright]),
		int2hex(BrightMapping[scene.StandbyBright]),
		int2hex(cctBrightMapping[scene.CctBright]),
		int2hex(time2hex(scene.DelayTime)),
		int2hex(time2hex(scene.DelayTime2)),
		int2hex(scene.AlsControlMode << 3 ^ (scene.DelayMode << 2) ^ scene.LightMode),
		"00"
	].join(" ")
}


const StringExecutor = {
	blink: (num) => {
		return `4D 1C ${num}`
	},
	setScene: (p) => {
		return "CD 51 " + ScenarioFactory(p)
	}
}


const getDataCmd = (action, p) => {

	let params = null
	if (isValidHexadecimal(p)) {
		params = p;
	} else if (typeof params === "string") {
		params = (int2hex(parseInt(p)));
	} else {
		params = p
	}
	return StringExecutor[action](p);
}




function CodedData(dataCmd) {
	let sendSerial = init(dataCmd)
	sendSerial.dataCmd = getDataCmd(sendSerial.action, sendSerial.params)

	const dataArray = [
		sendSerial.dBm,
		sendSerial.uuid,
		sendSerial.opc,
		getReq(),
		sendSerial.usbId,
		sendSerial.address,
		sendSerial.area,
		sendSerial.dataCmd,
	];
	let arr = dataArray.join(" ");
	let size = int2hex(arr.split(" ").length);
	const outArray = [sendSerial.head, sendSerial.CMD, size, arr];
	outArray.push(checksum(outArray.join(" ")));
	return outArray.join(" ");
}




//   入口部分~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function DecodeData(str) {
	// 数据统一入口
	if (str.length < 20) {
		return null;
	}
	const b = str.split(" ");
	return {
		head: b.slice(0, 2).join(" "),
		CMD: b.slice(2, 3).join(" "),
		size: b.slice(3, 4).join(" "),
		dBm: b.slice(4, 5).join(" "),
		uuid: b.slice(5, 11).join(" "),
		opc: b.slice(11, 12).join(" "),
		req: b.slice(12, 13).join(" "),
		number: b.slice(13, 15).join(" "),
		cluster: b.slice(15, 17).join(" "),
		area: b.slice(17, 19).join(" "),
		dataCmd: b.slice(19, b.length - 1).join(" "),
		sum: b.slice(b.length - 1).join(" "),
	};
}

const hexToInt = hexString => parseInt(hexString, 16);

const ScenarioParser = inputString => {
	const parts = inputString;

	if (parts.length !== 8) {
		throw new Error("Invalid input string format");
	}

	return {
		SceneNo: hexToInt(parts[0]),
		HighBright: Object.keys(BrightMapping).find(key => BrightMapping[key] === hexToInt(parts[1])),
		StandbyBright: Object.keys(BrightMapping).find(key => BrightMapping[key] === hexToInt(parts[2])),
		CctBright: Object.keys(BrightMapping).find(key => BrightMapping[key] === hexToInt(parts[3])),
		DelayTime: hexToInt(parts[4]),
		DelayTime2: hexToInt(parts[5]),
		AlsControlMode: (hexToInt(parts[6]) >> 3) & 0x07,
		DelayMode: (hexToInt(parts[6]) >> 2) & 0x01,
		LightMode: hexToInt(parts[6]) & 0x03,
	};
};

console.log(
	DecodeData("47 53 12 19 BA 50 54 7B 3A 54 05 83 28 1F 91 01 FE 00 01 4F 54 04 FF 51 14 14 14 00 00 D3")
);
const in_data = "47 53 12 19 BA 50 54 7B 3A 54 05 83 28 1F 91 01 FE 00 01 4F 54 04 FF 51 14 14 14 00 00 D3";
let call_func = null;
const g_data = {};

// let temp_data = decodeData(in_data)

// if (temp_data != null) {
//   if (!g_data[temp_data.uuid]) {
//     g_data[temp_data.uuid] = {};
//   }
//   console.log(temp_data);
//   let cmd = temp_data.dataCmd.split(" ")
//   if (cmd[0] == "4F") {
//     g_data[temp_data.uuid] = { ...g_data[temp_data.uuid], ...ScenarioParser(cmd.slice(2, 10)) }
//   }

//   call_func = () => { console.log("test"); }
//   if (call_func != null) {
//     call_func()
//     call_func = null;
//   }

//   g_data[temp_data.uuid] = { ...g_data[temp_data.uuid], ...temp_data }
//   console.log("out~~~~~~~~~~~~~~~~~~~~~~~");
//   console.log(g_data[temp_data.uuid]);
//   //TODO
//   console.log();
// }


// 测试部分~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let scene = {
	SceneNo: 0,
	HighBright: 22,
	StandbyBright: 0,
	CctBright: 0,
	DelayTime: 0,
	DelayTime2: 0,
	AlsControlMode: 2,
	DelayMode: 1,
	LightMode: 2,
}

let dataCmd = {
	code: "400",
	deviceName: 139,
	area: "00 01",
	address: "1F 91",
	action: "setScene",
	params: scene,
	identity: "",
};

// for (let index = 0; index < 10; index++) {
// 	console.log(CodedData(dataCmd));

// }

export default {
	CodedData,
	DecodeData
}