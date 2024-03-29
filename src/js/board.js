const MyCloudflare = new CloudflareWrapper();
const BingoTouch = "ontouchstart" in window ? "touchstart" : "click";
const MyBingoGames = new BingoGameDictionary( BingoGames.map(x => new BingoGame(x)) );
const MyBingoBalls = new BingoBalls();
// const MyBingoCards = new BingoCardFactory();

MyDom.ready ( async () => { 
    // Set the game options
    MyDom.setContent("#gameOptions", {"innerHTML": MyBingoGames.Options}, true);

    var mainBoardTemplate = await MyTemplates.getTemplateAsync("templates/board/bingoBoard.html", {});
    MyDom.setContent("#gameBoard", {"innerHTML": mainBoardTemplate});

    listenerOnKeyUp();

    // Set example card template
    setCardOnBoard();

    // Set iFrame height
    var pageHeight = document.documentElement.scrollHeight;
    var halfHeight = Math.floor(pageHeight / 2);
    var iFrame = document.querySelector("#checkBingoIframe");
    iFrame.style.height = halfHeight + 'px';
});


// Get the selected game
function getSelectedGame(){
    var gameName = MyDom.getContent("#gameOptions")?.value ?? "";
    return MyBingoGames.getGame(gameName) ?? undefined;
}

// Adds a listener for keystrokes (on keyup);
function listenerOnKeyUp(){
	document.addEventListener("keyup", function(event){
		switch(event.code)
		{
			case "Enter":
                let activeElement = document.activeElement;
                if( getSelectedGame() != "" ) {
                    if( (activeElement?.id ?? "") == "specificCardInput") {
                        onCheckSpecificCard();
                    } else {
                        onSelectNumber();
                    }
                }
				break;
			default:
				return;
		}
	});
}

// Set card on the board (used for example & validating BINGO)
async function setCardOnBoard(card="EXAMPLE"){
    var exampleCard = await MyCloudflare.KeyValues("GET", `bingo/card/?key=${card}`);
    var bingoCard = new BingoCard(exampleCard);
    var cardTemplate = await MyTemplates.getTemplateAsync("templates/cards/cardPlay.html", bingoCard);
    MyDom.setContent("#gameExampleTable", {"innerHTML": cardTemplate});
}

// Selecting the game to play
async function onSelectGame(select) {
	// Ensure target & value is set;
     var game = getSelectedGame();
    // Hide things
    MyDom.hideContent(".hideOnGameSelect");
    // Show/Enable things
    if(game != ""){
        MyDom.setContent(".enableOnSelectGame", {"disabled": ""});
        MyDom.showContent(".showOnGameSelect");
        MyDom.addClass("#startGameButton", "dlf_button_limegreen");
        MyDom.removeClass("#startGameButton", "dlf_button_gray");
        MyDom.setContent("#startGameButton", {"disabled":""});
        onShowGameExample();
    }
    
}

// Show example & describe
async function onShowGameExample(describe=false) {

    var game = getSelectedGame();
    if(game == undefined){ return; }

    // Specific card
    var card = MyDom.getContent("cardExampleInput")?.value ?? ""
    if(card != ""){
        await setCardOnBoard(card);
    }

    // Hide main table & show card example
    MyDom.hideContent(".hideOnGameExample");
    MyDom.showContent(".showOnGameExample");

    // Get required slots of this game & fill them in
    var reqSlots = game.RequiredSlots;
    var optSlots = game.OptionalSlots;
    MyDom.removeClass("#gameExampleTable .number_cell", "number_cell_required");
    MyDom.removeClass("#gameExampleTable .number_cell", "number_cell_optional");
    MyDom.removeClass("#gameExampleTable .number_cell", "number_selected");
    for(var cell of document.querySelectorAll("#gameExampleTable td.number_cell")){
        var slot = cell.getAttribute("data-slot-id");
        if(reqSlots.includes(slot)){
            cell.classList.add("number_cell_required");
            cell.classList.add("number_selected");
        } else if (optSlots.includes(slot)){
            cell.classList.add("number_cell_optional");
        } else { 
            cell.classList.remove("number_cell_required");
            cell.classList.remove("number_cell_optional");
        }
    }

    // If describing the game
    if(describe){
        await MyBingoVoice.speakText(game.Description, 0.6);
    }
}

// Start the game
async function onStartGame() {
	var selectedGame = getSelectedGame();
	if(selectedGame == undefined){
		alert("Please select a game first!");
		return;
	}

    // Disabl

    // Make sure things are all set for the new pool of balls
    MyBingoBalls.newBalls(selectedGame.Ignores);
    setBoardColumnVisibility(selectedGame.Ignores);

        // Hide/Disablethings
        MyDom.setContent(".disableOnGameStart", {"disabled": ""});
        MyDom.hideContent(".hideOnGameStart");
        MyDom.setContent("#gameOptions", {"disabled":"disabled"});
        MyDom.removeClass("#startGameButton", "dlf_button_limegreen");
        MyDom.addClass("#startGameButton", "dlf_button_gray");
        MyDom.setContent("#startGameButton", {"disabled":""});

        // Show things
        MyDom.showContent(".showOnGameStart");

    // Speak the game beginning
	await MyBingoVoice.speakText("Let the Game Begin");

	// Set the time the game was started
    let time = MyHelper.getDate("H:m:s K");
    MyDom.setContent("#gameStartedTimestamp", {"innerText": "Game started at: " + time});

}

// Set the visibility of columns on the board
function setBoardColumnVisibility(ignores=[]){
    var columns = Array.from(document.querySelectorAll("#gameBoardTable .gameBoardColumn"))
    for(var [idx,letter] of Object.entries("BINGO") ){
        var idxNum = Number(idx);
        if(ignores.includes(letter)){
            columns[idxNum].style.visibility = "hidden";
            continue;
        }
        columns[idxNum].style.visibility = "visible";
    }
}
// Select a number
async function onSelectNumber() {
    var gameName = getSelectedGame();
    if(gameName == "") {
        alert("Please select a game first");
        return;
    }

    // If currently disabled, just return;
    if( document.querySelector("#pickNumberButton")?.disabled ) { return; }

        // Hide Things
        MyDom.hideContent(".hideOnSelectNumber");
        // Clear Things
        MyDom.setContent(".clearOnSelectNumber", {"innerHTML":""});
        // Show things
        MyDom.showContent(".showOnSelectNumber");
        MyDom.setContent("#pickNumberButton", {"disabled":"disabled"});
        MyDom.addClass("#pickNumberButton", "dlf_button_gray");
        MyDom.setContent("#checkForBingoButton", {"disabled":"disabled"});
        MyDom.addClass("#checkForBingoButton", "dlf_button_gray");
        MyDom.setContent("#bingoBoardCardName", {"innerHTML":""});

    // Get a random ball from the game
    let randomBall = MyBingoBalls.getRandomBall();
    if(randomBall != ""){
        var ballHtml = MyBingoBalls.getBallHml(randomBall);
        MyDom.setContent("#bingoBallSection", {"innerHTML": ballHtml});
        MyDom.replaceClass(`[data-bingo-ball="${randomBall}"]`, "cell_unseen", "cell_seen");
        
        // Speak the ball number
        var ballText = MyBingoBalls.getBallText(randomBall);
        await MyBingoVoice.speakText(ballText, 0.9, 1500);
        await MyBingoVoice.speakText(ballText, 0.6);

        // All numbers?
        var letterCount = MyBingoBalls.getLetterCount(randomBall);
        if(letterCount == 15){
            var letter = ballText.split(" ")?.[0];
            let allNumMsg = `All numbers under the letter ${letter} have been called`;
            await MyBingoVoice.speakText(allNumMsg, 0.9, 1500);
            await MyBingoVoice.speakText(allNumMsg, 0.9);
        }
    }
        // Re-Enable
        MyDom.setContent("#pickNumberButton", {"disabled":""});
        MyDom.removeClass("#pickNumberButton", "dlf_button_gray");
        MyDom.setContent("#checkForBingoButton", {"disabled":""});
        MyDom.removeClass("#checkForBingoButton", "dlf_button_gray");
}

// Get cards and only show ones that have bingo
async function onCheckForBingo(){
    try {
        var game = getSelectedGame();
        if(game == undefined) {
            throw new Error("A game must be selected");
        }

        MyDom.hideContent(".hideOnCheckBingo");
        MyDom.setContent(".clearOnCheckForBingo", {"innerHTML": "", "value": ""})
        MyDom.showContent(".showOnCheckBingo");

        MyDom.showContent(".showOnCheckBingoLoading");

        // Set the list of cards based on URL
        var cards = await MyCloudflare.KeyValues("GET", `bingo/cards`);
        var bingoCards = cards.map( details => new BingoCard(details))?.filter( card => card.Details.Key != "EXAMPLE");
        var hasBingo = bingoCards
                            ?.map( card => { card.setSlotsFilled(MyBingoBalls.Called, game.hasFreeSlotRequired()); return card } )
                            ?.filter( card => card.hasBingo(game) )
       
        // Load the list of available cards
        var options = await MyTemplates.getTemplateAsync("templates/board/checkBingoOption.html", bingoCards);
        MyDom.setContent("#listOfCardOptions", {"innerHTML": options});
        MyDom.setContent("#checkCardKey", {"value": ""});

        // Set results
        MyDom.setContent("#matchingCards", {"innerHTML": ""}); 
        var cardPlurality = (hasBingo.lengh == 1) ? "card" : "cards";
        MyDom.setContent("#totalMatchingCards", {"innerHTML": `${hasBingo.length} matching ${cardPlurality}`});

        // Update text of any matching options
        var matchingSet = new Set( hasBingo.map(x => x.Details.Key) );
        var options = Array.from(document.querySelectorAll(".checkBingoOption"))?.filter(x => matchingSet.has(x.value));
        for(var opt of options){
            opt.innerHTML += " <span style='font-size:1px;'>(matching)</span>";
        }

        MyDom.hideContent(".hideOnCheckBingoResults");
        MyDom.showContent(".showOnCheckBingoResults");
    } catch (err){
        MyLogger.LogError(err);
    }

    
}

// Open up the given card in a new window ... with the given balls
function openCardWithBalls(){
    var cardKey = MyDom.getContent("#checkCardKey")?.value ?? "";
    var gameName = getSelectedGame()?.Name ?? ""
    if(cardKey == "" || gameName == ""){ return; }
    var balls = Array.from(MyBingoBalls.Called.keys()).join(",");
    var path = `/play/?cards=${cardKey}&game=${gameName}&balls=${balls}`;
    MyDom.setContent("#checkBingoIframe", {"src": path});
    MyDom.hideContent(".hideOnCheckCard");
    MyDom.showContent(".showOnCheckCard");
}


// RESET The game
function onResetGame(){
    let confirmReset = confirm("Are you sure you want to reset?");
    if(confirmReset){
        // Hide Things
        MyDom.hideContent(".hideOnReset");

        // Clear things
        MyDom.setContent(".disableOnReset", {"disabled": "true"});
        MyDom.setContent(".clearOnReset", {"innerHTML":"", "value": ""});
        setBoardColumnVisibility([]);
        MyDom.replaceClass(`[data-bingo-ball]`, "cell_seen", "cell_unseen");

        // Show Things
        MyDom.showContent(".showOnReset");
        MyDom.setContent("#gameOptions", {"disabled":""})
        MyDom.setContent("#gameOptions", {"value":""});
    }
}
