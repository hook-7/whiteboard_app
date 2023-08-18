<template>
	<view>
		<view>
			<view class="uni-form-item uni-column">
				<view class="title">switch</view>
				<view>
					<switch name="1" @change="()=>showform=!showform" :checked="showform" />
				</view>
			</view>
			<form @submit="formSubmit" @reset="formReset" v-if="showform">

				<view class="uni-form-item uni-column">
					<view class="title">有人亮度</view>
					<slider :value="scene.HighBright" @change="index=>scene.HighBright = index.detail.value" max="126"
						show-value>
					</slider>
				</view>

				<view class="uni-form-item uni-column">
					<view class="title">无人亮度</view>
					<slider :value="scene.StandbyBright" @change="index=>scene.StandbyBright = index.detail.value"
						max="126" show-value>
					</slider>
				</view>

				<view class="uni-form-item uni-column">
					<view class="title">色温</view>
					<slider :value="scene.CctBright" @change="index=>scene.CctBright = index.detail.value" max="100"
						show-value>
					</slider>
				</view>

				<view class="uni-padding-wrap">
					<view class="uni-title">延迟模式</view>
					<radio-group @change="r=>scene.DelayMode = r.detail.value">
						<label class="uni-list-cell uni-list-cell-pd" v-for="(item, index) in DelayMode"
							:key="item.value">
							<label class="radio">
								<radio :value="item.value" :checked="index === scene.DelayMode" />{{item.name}}
							</label>
						</label>
					</radio-group>
				</view>

				<view class="uni-form-item uni-column">
					<view class="title">一段延迟</view>
					<slider :value="scene.DelayTime" @change="index=>scene.DelayTime = index.detail.value" max="127"
						show-value>
					</slider>
				</view>

				<view class="uni-form-item uni-column" v-if="scene.DelayMode==1">
					<view class="title">二段延迟</view>
					<slider :value="scene.DelayTime2" @change="index=>scene.DelayTime2 = index.detail.value" max="127"
						show-value>
					</slider>
				</view>



				<view class="uni-padding-wrap">
					<view class="uni-title">模式</view>
					<radio-group @change="r=>scene.LightMode = r.detail.value">
						<label class="uni-list-cell uni-list-cell-pd" v-for="(item, index) in LightMode"
							:key="item.value">
							<label class="radio">
								<radio :value="item.value" :checked="index === scene.LightMode-1" />{{item.name}}
							</label>
						</label>
					</radio-group>
				</view>

				<view class="uni-btn-v">
					<button form-type="submit">Submit</button>
					<button type="default" form-type="reset">Reset</button>
					<button type="default" @click="showHexData">发送数据展示</button>
				</view>
			</form>
		</view>
	</view>
</template>

<script setup>
	import {
		reactive,
		ref
	} from 'vue';

	import decode from '@/common/decode.js'


	const showform = ref(true)

	const LightMode = [{
			value: '1',
			name: '感应',
		},
		{
			value: '2',
			name: '常灭'
		},
		{
			value: '3',
			name: '常亮'
		}
	]
	const DelayMode = [{
			value: '0',
			name: '一段',
		},
		{
			value: '1',
			name: '二段'
		},
	]

	const scene = reactive({
		SceneNo: 0,
		HighBright: 22,
		StandbyBright: 0,
		CctBright: 0,
		DelayTime: 0,
		DelayTime2: 0,
		AlsControlMode: 2,
		DelayMode: 1,
		LightMode: 1,
	})

	let dataCmd = {
		code: "400",
		deviceName: 139,
		area: "00 01",
		address: "1F 91",
		action: "setScene",
		params: scene,
		identity: "",
	};

	const formSubmit = (e) => {
		dataCmd.params = scene
		console.log(decode.CodedData(dataCmd));
		const formdata = e;
		uni.showModal({
			content: '表单数据内容：' + JSON.stringify(scene),
			showCancel: false
		});
	};

	const formReset = () => {
		console.log('清空数据');
	};

	const showHexData = () => {
		uni.showModal({
			content: decode.CodedData(dataCmd),
			showCancel: false
		});
	}



	const test = (e) => {
		// console.log(e);
		// scene.HighBright = e.detail.value
		console.log(scene);

	};
</script>

<style>
	.uni-form-item .title {
		padding: 20rpx 0;
	}
</style>