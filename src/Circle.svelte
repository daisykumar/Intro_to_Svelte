
<script>
//We need to type export to export things from one component to main App.svelte
    export let text = 'Fun Fun Fun'
</script>

<main>
<div>{text}</div>
</main>

<style>
main{
    display: grid;
    justify-content: center;
}
div{
	height: 200px;
	width: 200px;
	margin: 20px;

	display: flex;
	align-items: center;
	justify-content: center;

	background-color: sandybrown;
	color: aliceblue;
	border-radius: 100%;

	font-size: 2rem;
}

</style>