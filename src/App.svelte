<script>
//intro to svelte
import Circle from './Circle.svelte';

//how to use css in svelte
import Butterfly from './Butterfly.svelte';

// how to use <if> blocks
import Square from './Square.svelte';
let user = { clicks: false };

function toggle(){
	user.clicks = !user.clicks;
}

//how to use Event Handlers
	let naturePics = [
		"https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
		"https://images.unsplash.com/photo-1504567961542-e24d9439a724?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
		"https://images.unsplash.com/photo-1508873881324-c92a3fc536ba?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
	];

	let naturePicsIndex = 0;

	function naturePic(){
		naturePicsIndex += 1;
	}


</script>

<main>
	{#if user.clicks}
		<button on:click={toggle}> Click Me</button>
		<Circle text = "Just Like that" />
		
	{:else} 
		<button on:click={toggle}>Click Me</button>
		<Square />
		
	{/if}


		<div class="app-container">
		<Butterfly />
		<br>
		<Butterfly />
		<br>
		<Butterfly />
		</div>

		<img alt="" src={naturePics[naturePicsIndex]}>
		<button on:click={naturePic}>
			Get Nature Pics
		</button>
	
</main>
<style>
	main{
		display: grid;
		justify-content: center;
		align-items: center;
	}
	.app-container{
		padding: 80px;
		display: grid;
    	justify-content: center;
	}

	.app-container :global(img){
		border-radius: 100%;
  		width: 200px;
  		height: 200px;
	}

	button{
		padding: 1em 2.1em 1.1em;
		border-radius: 3px;
		margin: 10px 10px 60px 10px;
		color: #fbdedb;
		background-color: #fbdedb;
		display: inline-block;
		background: #db0aee;
		cursor: pointer;
		-webkit-transition: 0.3s;
		-moz-transition: 0.3s;
		-o-transition: 0.3s;
		transition: 0.3s;
		font-weight: 800;
		font-size: .85em;
		text-transform: uppercase;
		text-align: center;
		text-decoration: none;
		-webkit-box-shadow: 0em -0.3rem 0em rgba(0, 0, 0, 0.1) inset;
		-moz-box-shadow: 0em -0.3rem 0em rgba(0, 0, 0, 0.1) inset;
		box-shadow: 0em -0.3rem 0em rgba(0, 0, 0, 0.1) inset;
		position: relative;
	}

	button:hover, button:focus {
		opacity: 0.8;
	}

	button:active{
		-webkit-transform: scale(0.80);
		-moz-transform: scale(0.80);
		-ms-transform: scale(0.80);
		-o-transform: scale(0.80);
		transform: scale(0.80);
}
</style>



  
