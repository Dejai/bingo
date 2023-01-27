
/************************ GLOBAL VARIABLES ****************************************/
var touchEvent = "ontouchstart" in window ? "touchstart" : "click";

/*********************** GETTING STARTED *****************************/

    // Once doc is ready
    mydoc.ready(()=>{

        // Set Trello board name
    	MyTrello.SetBoardName("bingo");

        // Load the saved cards
        loadSavedCards();

        // Search bar
        onSearchBlur();
    });

    // Get the saved cards
    async function loadSavedCards()
    {
        var cardLoadHTML = "";
        var listOfCards = await CardPromises.getCardsByList("NAMED_CARDS");

        // Sort the cords;
        listOfCards.sort( (a, b)=>{ return a["pos"] - b["pos"]; });
        console.log(listOfCards);

        // Get the template for each card
        for(var idx in listOfCards)
        {
            let card = listOfCards[idx];
            var cardNameSplit = card["name"]?.split(" - ") ?? ["n/a", "n/a"];
            var cardObj = { "ID":card["id"] , "Name":cardNameSplit[0], "Code":cardNameSplit[1] };

            let template = await CardPromises.getTemplate("/templates/cardLoad.html", cardObj);

            cardLoadHTML += template;
        }
        mydoc.setContent("#listOfCards", {"innerHTML":cardLoadHTML});
    }

    // Get the search related values
    function onGetSearchValues()
    {
        let placeholder = document.getElementById("searchBar")?.getAttribute("data-jpd-placeholder");
        let filterValue = mydoc.getContent("#searchBar")?.innerText ?? "";
        filterValue = (filterValue == "" || filterValue == placeholder) ? " " : filterValue;

        return { "Filter": filterValue, "Placeholder": placeholder }
    }

    // Filter the list of games
    function onFilterCards()
    {
        let search = onGetSearchValues();

        // Show option to clear search;
        // var _clearIcon = (search.Filter != " ") ? mydoc.showContent("#searchClearIcon") : mydoc.hideContent("#searchClearIcon");
		if(search.Filter != " "){ 
            mydoc.showContent("#searchClearIcon"); 
            mydoc.addClass("#searchClearIcon", "fa");
        } 

        document.querySelectorAll(".cardLoadBlock")?.forEach( (item)=>{

            let innerText = item.innerText.toUpperCase().replace("\n", " ");
            let searchText = search.Filter.toUpperCase().trim();

            if(!innerText.includes(searchText))
            {
                item.classList.add("hidden");
            }
            else
            {
                item.classList.remove("hidden");
            }
        }); 

    }

    // Focusing into the search bar
    function onSearchFocus()
    {
        let search = onGetSearchValues();
        if(search.Filter == " ")
        {
            mydoc.setContent("#searchBar", {"innerText":""});
        }
        mydoc.addClass("#searchBar", "searchText");
        mydoc.removeClass("#searchBar", "searchPlaceholder");
    }

    // Blurring from the search bar
    function onSearchBlur()
    {
        let search = onGetSearchValues();
        if(search.Filter == " ")
        {
            mydoc.addClass("#searchBar", "searchPlaceholder");
            mydoc.removeClass("#searchBar", "searchText");
            mydoc.setContent("#searchBar", {"innerText":search.Placeholder});
            mydoc.hideContent("#searchClearIcon");
            mydoc.removeClass("#searchClearIcon", "fa");
        }        
    }

	// Clear the search
	function onClearSearch()
	{
        mydoc.setContent("#searchBar" ,{"innerText":""});
		onFilterCards();
		onSearchBlur();
	}

    // Toggle a card being selected
    function onToggleCardSelect(event)
    {

        // Check how many are already selected

        
        // Get the selected bloc
        let target = event.target;
        let block = target.closest(".cardLoadBlock");
        let cardID = block.getAttribute("data-card-id");
        let isSelected = block.classList.contains("selected");

        console.log(block);
        console.log(cardID);
        console.log(isSelected);
        console.log(`[data-card-id='${cardID}]`);
        console.log(document.querySelector(`[data-card-id='${cardID}]`));

        // Show/hide things based on the content
        if(!isSelected)
        {
            mydoc.addClass(`[data-card-id='${cardID}']`, "selected");
            mydoc.addClass(`[data-card-id='${cardID}'] .selectCardButton`, "dlf_button_red");
            mydoc.removeClass(`[data-card-id='${cardID}'] .selectCardButton`, "unselected");
            mydoc.setContent(`[data-card-id='${cardID}'] .selectCardButton`, {"innerText": "REMOVE"});
        }
        else
        {
            mydoc.removeClass(`[data-card-id='${cardID}']`, "selected");
            mydoc.removeClass(`[data-card-id='${cardID}'] .selectCardButton`, "dlf_button_red");
            mydoc.addClass(`[data-card-id='${cardID}'] .selectCardButton`, "unselected");
            mydoc.setContent(`[data-card-id='${cardID}'] .selectCardButton`, {"innerText": "SELECT"});
        }

        // Get the amount selected
        let amountSelected = document.querySelectorAll(".cardLoadBlock.selected")?.length ?? 0;
        if(amountSelected > 0)
        {
            let s = (amountSelected > 1) ? 'S' : '' ;
            mydoc.setContent("#useCardButton", {"innerHTML": `USE ${amountSelected} CARD${s}`});
            mydoc.showContent("#useCardSection");

            var _action = (amountSelected == 3) ?  mydoc.hideContent(".selectCardButton.unselected") :
                            mydoc.showContent(".selectCardButton.unselected")
        }
    }

    // Use the selected cards
    function onUseSelectedCards()
    {

        let cardIDs = [];
        document.querySelectorAll(".cardLoadBlock.selected")?.forEach( (block) =>{

            let id = block.getAttribute("data-card-id");
            cardIDs.push(id);
        });

        let cardIDsList = cardIDs.join(",");
        location.href = `/card/play/?cardlist=${cardIDsList}`;
    }