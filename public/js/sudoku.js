//A new game contains a board and some functions to interact with the board

//Create a Board
class Board{
    
    constructor(unitOfBoard,boardContainer){
        this.unitOfBoard=unitOfBoard;

        this.sizeOfBoard= Math.pow(unitOfBoard,2);

        //Create a table of sizeOfBoard x sizeOfBoard
        var boardTable = document.createElement('table');
        boardTable.setAttribute('class','board-table');
        boardContainer.appendChild(boardTable);
            for (var i=0;i<this.sizeOfBoard;i++) {
                var boardTr = document.createElement("tr");
                boardTr.setAttribute('id','tr '+i);
                boardTable.append(boardTr);
                for (var j=0;j<this.sizeOfBoard;j++) {
                    
                    //Create a table cell > button > span
                    var boardTd = document.createElement("td");
                    boardTd.setAttribute('class', 'boardTd r'+i+' c'+j);
                    boardTr.appendChild(boardTd);

                }
            }

        //set the section area
        var setAttributeForBorder=function(sectionBttn,newClassName){
            sectionBttn.classList.add(newClassName);
            };

        
        for(var i=2;i<this.sizeOfBoard;i+=this.unitOfBoard) {
            var boardTds = document.querySelectorAll('.boardTd.r'+i);
            boardTds.forEach(function(boardTd){setAttributeForBorder(boardTd,'board-section-bottom')});
            var boardTds=document.querySelectorAll('.boardTd.c'+i);
            boardTds.forEach(function(boardTd){setAttributeForBorder(boardTd,'board-section-right')});            
        };
        this.boardTable=boardTable;
    }

      //Handle popup function
       numberTable (boardContainer){
        var numberTable = document.createElement('table');
        numberTable.setAttribute('class','number-table');
        var curNumber=0;

        for(var i=0;i<this.unitOfBoard;i++){
            var numberTr = document.createElement('tr');
            numberTable.appendChild(numberTr);
            for(var j=0;j<this.unitOfBoard;j++){
                curNumber++;
                var numberTd = document.createElement('td');
                numberTr.appendChild(numberTd);
                var numberBttn = document.createElement('button');
                numberBttn.textContent = curNumber;
                numberTd.appendChild(numberBttn);
            };
        };
        var numberTableElement=boardContainer.appendChild(numberTable);
        return numberTableElement;
    };
}

/*
 
*/

//After the document is read, 
//Create a blank board
document.addEventListener('DOMContentLoaded', function(){

    var config = {
        unitOfBoard: 3,
        container: document.getElementById("board"),
    };
    
    var newBoard = new Board(config.unitOfBoard,config.container);
    
    config.container.addEventListener('mouseover',e=>{
        if(e.target.classList.contains('boardTd')){
            var numberTableElement=newBoard.numberTable(config.container);
            
            //var boardRow=e.target.classList;

            config.container.addEventListener('mouseout',e2=>{
                
                if(!e2.target.isSameNode(numberTableElement)||!e2.target.isSameNode(e.target)) {
                    numberTableElement.remove();
                }
            })
        }
    })
})


Board.prototype={

    BoardQuestion: function(){

    }
}

function Game(){

    function Start(){
        createTimer;
        createBoard;
    }
    function createBoard(){

    }
    function createTimer(){
            this.time={
                minute:0,
                second:0,
            };

            this.Start=()=> setInterval(() => {
                this.time.second++;
                if(this.time.second == 60){
                    this.time.minute++;
                    this.time.second = 0;
                }
            }, 1000);

            this.container = document.querySelector("timer");
            this.container.innerHTML = function(){
                
                return this.minute.toString().padStart(2,'0') + ':' + this.second.toString().padStart(2,'0');
            }
    
        
    }
}

function NewGame(){
    var currentGame = new Game;
    currentGame.createTimer.Start
}