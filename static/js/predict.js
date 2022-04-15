//const CLASSES = {0:'グー', 1:'one', 2:'チョキ', 3:'three', 4:'four',5:'パー', 6:'six', 7:'seven', 8:'eight', 9:'nine'}
const CLASSES = {0:'グー', 2:'チョキ', 5:'パー'}
//-----------------------
// start button event
//-----------------------

$("#start-button").click(function(){
	loadModel() ;
	startWebcam();
});

//-----------------------
// load model
//モデルの読み込みはホストされた状態でなければなりません。
//tf.loadModel()メソッドを使い読み込みます。
//-----------------------

let model;
async function loadModel() {
	console.log("model loading..");
	$("#console").html(`<li>model loading...</li>`);
	model=await tf.loadModel(`http://localhost:5050/sign_language_vgg16/model.json`);
	console.log("model loaded.");
	$("#console").html(`<li>VGG16 pre trained model loaded.</li>`);
};

//-----------------------
// start webcam 
//Webカメラの操作はnavigator.mediaDevices.getUserMedia()のドキュメントに沿って記述
//-----------------------

var video;
function startWebcam() {
	console.log("video streaming start.");
	$("#console").html(`<li>video streaming start.</li>`);
	video = $('#main-stream-video').get(0);
	vendorUrl = window.URL || window.webkitURL;

	navigator.getMedia = navigator.getUserMedia ||
						 navigator.webkitGetUserMedia ||
						 navigator.mozGetUserMedia ||
						 navigator.msGetUserMedia;

	navigator.getMedia({
		video: true,
		audio: false
	}, function(stream) {
		localStream = stream;
		video.srcObject = stream;
		video.play();
	}, function(error) {
		alert("Something wrong with webcam!");
	});
}

//-----------------------
// predict button event

//推論をsetInterval()を使って0.1秒ごとに実行します。
//-----------------------

$("#predict-button").click(function(){
	setInterval(predict, 1000/1);
});

//-----------------------
// TensorFlow.js method
// predict tensor
//-----------------------

/*
推論はmodel.predict()メソッドを使って行います。
戻り値の推論値とクラス名を紐付けるのにArray.from()メソッドとmap()関数を使います。
戻り値の高い順にソートするためsort()メソッドとslice()メソッドを利用します。

sort関数は引数に関数を指定でき、関数でソートのルールを定義できる。
	関数の戻り値が正の時　→　引数1を引数2の後ろに並べ替え。
	関数の戻り値が負の時　→　引数1を引数2の前に並べ替え。
	関数の戻り値が0の時　→　何もしない。
*/

async function predict(){
	let tensor = captureWebcam();

	let prediction = await model.predict(tensor).data();
	let results = Array.from(prediction)
				.map(function(p,i){
	return {
		probability: p,
		className: CLASSES[i]
	};
	}).sort(function(a,b){
		return b.probability-a.probability;
	}).slice(0,1);

	$("#console").empty();

	/*results.forEach(function(p){
		$("#console").append(`<li>${p.className} : ${p.probability.toFixed(6)}</li>`);
		console.log(p.className,p.probability.toFixed(6))
	};
		*/
	
	
		results.forEach(function(p){
		if (p.probability > 0.50){
			if (p.className != undefined){
				//Object.keys(CLASSES).map((value, index) => index);
				if (p.className === "グー"){
					$("#console").append(`<li>${p.className} : ${p.probability.toFixed(6)}</li>`);
					R_Click(0);
				}else if (p.className === "チョキ"){
					$("#console").append(`<li>${p.className} : ${p.probability.toFixed(6)}</li>`);
					R_Click(1);
				}else{
					$("#console").append(`<li>${p.className} : ${p.probability.toFixed(2)}</li>`);
					R_Click(2);
				};
			}else{
				$("#console").append("認識できません！");
			};
			
			//CLASSES.keys(data);
			//Object.fromEntries(Object.entries(CLASSES).filter(([, v]) => v !== undefined));
			/*
			CLASSES["0"] = 0;
			CLASSES["2"] = 1;
			CLASSES["5"] = 2;
			*/

			
		}else{
			$("#console").append("もっとはっきりと！");
		};
	})

};

//------------------------------
// capture streaming video 
// to a canvas object
//動画をcanvasとしてキャプチャすることで推論用の画像生成が簡単に行なえます。
//空要素canvasを生成し、video要素からcanvasの切り出し位置を指定して切り出し
//------------------------------

function captureWebcam() {
	var canvas    = document.createElement("canvas");
	var context   = canvas.getContext('2d');
	canvas.width  = video.width;
	canvas.height = video.height;

	context.drawImage(video, 0, 0, video.width, video.height);
	tensor_image = preprocessImage(canvas);

	return tensor_image;
}

//-----------------------
// TensorFlow.js method
// image to tensor
//-----------------------
/*まずtf.fromPixels().toFloat()メソッドでcanvasの画像をNumpy形式のテンソルに変換しています。
デフォルトはカラー3チャンネルですが指定をすれば白黒画像にすることも可能です。
ここではresizeNearestNeighbor()メソッドで画像サイズ100x100の指定をしています。
続いてtf.scalar()メソッドとtf.div()メソッドを使い画像のRGB階調値255を0～1の値へと正則化します。
最後に.expandDims()メソッドで読み込み画像のチャンネル1を追加し4次元テンソルに変換します。
各メソッドはTensorFlow.jsのリファレンスにて
*/

function preprocessImage(image){
	let tensor = tf.fromPixels(image).resizeNearestNeighbor([100,100]).toFloat();	
	let offset = tf.scalar(255);
    return tensor.div(offset).expandDims();
}

//-----------------------
// clear button event
//-----------------------

$("#clear-button").click(function clear() {
	location.reload();
});