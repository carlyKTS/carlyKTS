//A new game contains a board and some functions to interact with the board
function Board(unitOfBoard,boardContainer){
        this.unitOfBoard=unitOfBoard;
        this.boardContainer = boardContainer;

        this.sizeOfBoard= Math.pow(unitOfBoard,2);
};

Board.prototype={

    NewGame:function(){
        
    },

    boardConstruct:function() {
        var lineH = 1/this.sizeOfBoard*100
        
        //Create a table of sizeOfBoard x sizeOfBoard
        var boardTable = document.createElement('table');
        boardTable.setAttribute('class','board-table');
        this.boardContainer.appendChild(boardTable);
            for (var i=0;i<this.sizeOfBoard;i++) {
                var boardTr = document.createElement("tr");
                boardTr.setAttribute('id','tr '+i);
                boardTr.style.lineHeight=lineH+"%"
                boardTr.style.height=lineH+"%"
                boardTable.append(boardTr);
                for (var j=0;j<this.sizeOfBoard;j++) {
                    
                    //Create a table cell > button > span
                    var boardTd = document.createElement("td");
                    boardTd.setAttribute('class', 'boardTd r'+i+' c'+j);
                    var boardTdElement = boardTr.appendChild(boardTd);
                    boardTdElement.addEventListener('mousedown',e=>{
            
                        document.querySelectorAll('.number-table').forEach((nT)=>{
                            nT.remove();
                        });
                        
                        curTarget = e.target;
                        numberTableElement=this.numberTableConstruct(this.boardContainer);
                        
                        numberTableElement.style.left=e.clientX +"px";
                        numberTableElement.style.top= e.clientY +"px";
            
                        numberTableElement.addEventListener('mousedown',e2=>{
                            var numRegExp = /\d/;

                            var reply = e2.target.innerText;
                            if(reply.match(numRegExp)){
                                curTarget.innerText=reply;
                            }else{
                                curTarget.innerText='';
                            }
                            numberTableElement.remove();
                        })
                        
                    })
                    
                }
            }

        //set what td need to have thick border
        var setAttributeForBorder=function(sectionBttn,newClassName){
            sectionBttn.classList.add(newClassName);
            };
        
        //normal sudoku get thick border every 3 cells
        for(var i=2;i<this.sizeOfBoard;i+=this.unitOfBoard) {
            var boardTds = document.querySelectorAll('.boardTd.r'+i);
            boardTds.forEach(function(boardTd){setAttributeForBorder(boardTd,'board-section-bottom')});
            var boardTds=document.querySelectorAll('.boardTd.c'+i);
            boardTds.forEach(function(boardTd){setAttributeForBorder(boardTd,'board-section-right')});            
        };

        this.boardTable=boardTable;
    },

    numberTableConstruct:function(){
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
                numberTd.innerText = curNumber;
                
            };
        };
        var clearTr = document.createElement('tr');
        var clearTd = document.createElement('td');
        clearTd.innerText = 'Clear';
        clearTd.setAttribute('class','clear');
        clearTd.colSpan = this.unitOfBoard;
        clearTr.appendChild(clearTd);
        numberTable.appendChild(clearTr);
        var numberTableElement=this.boardContainer.appendChild(numberTable);
        return numberTableElement;
    },
};


//adding the control functions
document.addEventListener('DOMContentLoaded', function(){

    var config = {
        unitOfBoard: 3,
        container: document.getElementById("board"),
    };

    document.querySelectorAll('button').forEach((bttn)=>{
        
        var functionName = bttn.innerText.replace(' ','');
        bttn.onclick = newBoard[functionName];
    });
        
    var newBoard = new Board(config.unitOfBoard,config.container);
    newBoard['boardConstruct']();
})