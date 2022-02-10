
function arrayEquals(a, b) {
    return Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index]);
  }

//A new game contains a board and some functions to interact with the board
function Board(sectionSetting,unitOfBoard,boardContainer){
        this.sectionSetting=sectionSetting;
        this.unitOfBoard=unitOfBoard;
        this.boardContainer = boardContainer;
        this.sizeOfBoard= Math.pow(unitOfBoard,2);
};

Board.prototype.createBoardQuestion=function(){
    var totalTd = this.sizeOfBoard**2;
    var givenTd = totalTd*0.5;
    var boardQuestion = new Array(totalTd).fill(0);
    var givenNumLocation = [];

    /*Generate 20.9% of the cell number in the table
    * Get where those number located in by random
    */

    while(boardQuestion.includes(0)){
        for (var i=0;i<this.sizeOfBoard;i++){
            for(var j=0;j<this.sizeOfBoard;j++){
                var p=i*this.sizeOfBoard+j;
                var potentialNumArr = getPotentialNumArr(this,p,boardQuestion);
                if(potentialNumArr.length>0){
                    var chosen = Math.floor(Math.random()*potentialNumArr.length);
                    var chosenNum = potentialNumArr[chosen];
                    boardQuestion[p]=chosenNum;
                }
            }
            var low = i*this.sizeOfBoard;
            var rng=Array.from({length:this.sizeOfBoard},(_,i)=>i+1)
            var rowArr = getBannedArr(this,low,'row',boardQuestion).sort(function(a,b){return a-b});
            if(!arrayEquals(rowArr,rng)){
                boardQuestion=Array(totalTd).fill(0);
                break;
            }
        }
    }

    while(givenNumLocation.length<givenTd){
        var r = Math.floor(Math.random()*totalTd);
        if(!givenNumLocation.includes(r)){
                givenNumLocation.push(r);
        };
    };
    
    givenNumLocation = givenNumLocation.sort(function(a,b){return a-b});
    
    givenNumLocation.forEach((givenNum)=>{
        var r=Math.floor(givenNum/this.sizeOfBoard);
        var c=givenNum%this.sizeOfBoard;
        var setNum = boardQuestion[givenNum];
            if(setNum!=0){
                var curTd = document.querySelector("[id='tr\ "+r+"'] > td.boardTd.r"+r+".c"+c);
                curTd.innerText=setNum;
            };
    })

    this.boardQuestion=boardQuestion;

};

//0 <= curPosition < (sizeOfBoard**2)
function getRowNum(boardObj,curPosition){
    //0 <= rowNum < sizeOfBoard
    return Math.floor(curPosition/boardObj.sizeOfBoard);
}

function getColNum(boardObj,curPosition){
    //0 <= colNum < sizeOfBoard
    return curPosition%boardObj.sizeOfBoard;
}

function getPosition(cur,size){
    this.uppPosition = cur*size+size;
    this.lowPosition=this.uppPosition-size;
}

function getBannedArr(boardObj,curPosition,criteria,curBoard){
    var colNum = getColNum(boardObj,curPosition);
    var rowNum = getRowNum(boardObj,curPosition);
    const rng=Array.from({length:boardObj.sizeOfBoard},(_,i)=>i+1);
    var returningArr=[]

    switch(criteria){
        case 'row':
            var rowPosition = new getPosition(rowNum,boardObj.sizeOfBoard);
            var rowArr = curBoard.slice(rowPosition.lowPosition,rowPosition.uppPosition);
            //console.log('When size of board is '+boardObj.sizeOfBoard+'. In row '+rowNum+' lower is '+rowPosition.lowPosition+' upper is '+rowPosition.uppPosition+' row array is '+rowArr)
            returningArr= rowArr;
            break;
        case 'column':
            var colArr=[];
            for(var i=colNum;i<(boardObj.sizeOfBoard**2);i+=boardObj.sizeOfBoard){
                colArr.push(curBoard[i])
            };
            //console.log('When size of board is '+boardObj.sizeOfBoard+'. In column '+colNum+' column array is '+colArr)
            returningArr= colArr;
            break;
        case 'section':
            var curElement = boardObj.boardTable.querySelector('.boardTd.r'+rowNum+'.c'+colNum);
            var sectionClass;
            
            curElement.classList.forEach((value)=>{
                if (value.startsWith('section-number-')){
                    sectionClass = value;
                }
            })
            var secArr=[];
            var r,c;
            var rowsOfSec=[],colsOfSec=[],positionSec=[];
            boardObj.boardTable.querySelectorAll('.'+sectionClass).forEach((boardTd)=>{
                
                boardTd.classList.forEach((value)=>{
                    if(value.startsWith('r')){
                        r=Number(value.replace('r',''))
                    }else if(value.startsWith('c')){
                        c=Number(value.replace('c',''))
                    }
                })
                rowsOfSec.push(r);
                colsOfSec.push(c);
                var tdPosition=r*boardObj.sizeOfBoard+c;
                positionSec.push(tdPosition);
                addNum=curBoard[tdPosition];
                secArr.push(addNum);
            })
            
            returningArr= secArr;
            break;
        case 'section-regular':
            var colSec = Math.floor(colNum/boardObj.unitOfBoard);
            var rowSec = Math.floor(rowNum/boardObj.unitOfBoard);
            var rowSecPosition = new getPosition(rowSec,boardObj.unitOfBoard);
            var colSecPosition = new getPosition(colSec,boardObj.unitOfBoard);
            var secArr = [];
            for (var i=rowSecPosition.lowPosition;i<rowSecPosition.uppPosition;i++){
                for (var j=colSecPosition.lowPosition;j<colSecPosition.uppPosition;j++){
                    secArr.push(curBoard[i*boardObj.sizeOfBoard+j]);
                }
            }
            //console.log('Current position is '+curPosition+' When size of board is '+boardObj.sizeOfBoard+'. In column section '+colSec+' row section '+rowSec+' section array is '+secArr)
            returningArr= secArr;
        case 'section-irregular':
            break;
    } 

    //console.assert(rng.filter(x=>!returningArr.includes(x)).length>0,'No potential array return in '+curPosition+' due to '+criteria+' '+returningArr)

    return returningArr
};

function getPotentialNumArr(boardObj,curPosition,curBoard){
    function getAllBannedArr(boardObj,position,board){
        this.rowArr = getBannedArr(boardObj,position,'row',board);
        this.colArr = getBannedArr(boardObj,position,'column',board);
        this.secArr = getBannedArr(boardObj,position,'section',board);
        this.allBannedArr = this.rowArr.concat(this.colArr).concat(this.secArr);
        
    }
    
    var curPositionBannedArr = new getAllBannedArr(boardObj,curPosition,curBoard)
    
    var potentialNumRng = Array.from({length:boardObj.sizeOfBoard},(_,i)=>i+1);
    
    var r = getRowNum(boardObj,curPosition);
    var c = getColNum(boardObj,curPosition);
    var curPositionElement = boardObj.boardTable.querySelector('.boardTd.r'+r+'.c'+c);

    var potentialNumArr = potentialNumRng.filter(x=>!curPositionBannedArr.allBannedArr.includes(x));

    //Check whether other unset number within section affect potential choices

    var sectionClass;            
    curPositionElement.classList.forEach((value)=>{
        if (value.startsWith('section-number-')){
            sectionClass = value;
        }
    })

    var sameSectionElements=boardObj.boardTable.querySelectorAll('.'+sectionClass);
    var sameSecArr=[];

    sameSectionElements.forEach((secElement)=>{
        var secElementRow,secElementCol;
        secElement.classList.forEach((value)=>{
            if(value.startsWith('r')){
                secElementRow=Number(value.replace('r',''))
            }else if(value.startsWith('c')){
                secElementCol=Number(value.replace('c',''))
            }
        })
        var secElementPosition = secElementRow*boardObj.sizeOfBoard+secElementCol;
        sameSecArr.push(secElementPosition);
    })
    sameSecArr=sameSecArr.filter(x=>x>curPosition);

    const fRowArr = (s,r)=>Array.from({length:s},(_,i)=>s*r+i);
    const fColArr = (s,c)=>Array.from({length:s},(_,i)=>c+s*i)

    var sameRowArr=fRowArr(boardObj.sizeOfBoard,r).filter(x=>x>curPosition);
    var sameColArr=fColArr(boardObj.sizeOfBoard,c).filter(x=>x>curPosition);

    function getRelevantCellPotential(boardObj,arr,board,curPosition,potentialNumRng){
        var relevantCellPotential=[]
        arr.forEach((p)=>{
            var elementBannedArr = new getAllBannedArr(boardObj,p,board);
            var elementPotentialArr =  potentialNumRng.filter(x=>!elementBannedArr.allBannedArr.includes(x));
            relevantCellPotential=relevantCellPotential.concat(elementPotentialArr);
        })
        relevantCellPotential=[... new Set(relevantCellPotential)]
        return relevantCellPotential
    }

    function cuttingPotentialArr(potentialNumRng,potentialNumArr,relevantCellPotential,relevantArr){

        var potentialRestrictionArr = potentialNumRng.filter(x=>!relevantCellPotential.includes(x))
        var potentialNumArrCutted=potentialNumArr.filter(x=>potentialRestrictionArr.includes(x))
        if(potentialNumArrCutted.length>0){
            return potentialNumArrCutted;
        }else{
            return potentialNumArr;
        }
    }
    
    var sameRowPtntl= getRelevantCellPotential(boardObj,sameRowArr,curBoard,curPosition,potentialNumRng)
    var sameColPtntl= getRelevantCellPotential(boardObj,sameColArr,curBoard,curPosition,potentialNumRng)
    var sameSecPtntl= getRelevantCellPotential(boardObj,sameSecArr,curBoard,curPosition,potentialNumRng)

    var originalPtntlNumArr = potentialNumArr
    
    potentialNumArr=cuttingPotentialArr(potentialNumRng,potentialNumArr,sameRowPtntl,sameRowArr)
    potentialNumArr=cuttingPotentialArr(potentialNumRng,potentialNumArr,sameColPtntl,sameColArr)
    potentialNumArr=cuttingPotentialArr(potentialNumRng,potentialNumArr,sameSecPtntl,sameSecArr)

    return potentialNumArr;
};


Board.prototype.boardConstruct=function(){

    if(document.getElementsByClassName('board-table').length!=0){
        document.querySelector('.board-table').remove();
    }
    
    var lineH = 1/this.sizeOfBoard*100
    
    //Create a table of sizeOfBoard x sizeOfBoard
    var boardTable = document.createElement('table');
    boardTable.setAttribute('class','board-table');
    var boardTableElement=this.boardContainer.appendChild(boardTable);
    this.boardTable=boardTableElement;
    
        for (var i=0;i<this.sizeOfBoard;i++) {
            var boardTr = document.createElement("tr");
            boardTr.setAttribute('id','tr '+i);
            boardTr.style.lineHeight=lineH+"%"
            boardTr.style.height=lineH+"%"
            boardTable.append(boardTr);
            for (var j=0;j<this.sizeOfBoard;j++) {
                
                //Create a table cell
                var boardTd = document.createElement("td");
                boardTd.setAttribute('class', 'boardTd r'+i+' c'+j);
                boardTr.appendChild(boardTd);
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


    function setSectionClassName(boardObj){
        
        switch(boardObj.sectionSetting){
            case 'section-regular':
                for(var i=0;i<boardObj.sizeOfBoard;i++){
                    for(var j=0;j<boardObj.sizeOfBoard;j++){
                        var secNum = Math.floor(i/boardObj.unitOfBoard)*boardObj.unitOfBoard+Math.floor(j/boardObj.unitOfBoard);
                        var boardTd = boardTableElement.querySelector('.boardTd.r'+i+'.c'+j)
                        boardTd.classList.add('section-number-'+secNum);
                    }
                }
                break;
            case 'section-irregular':
                break;
        }
    }

    setSectionClassName(this);

    this.createBoardQuestion()

    boardTableElement.querySelectorAll('.boardTd').forEach((boardTdElement)=>{
        var numRegExp = /\d/;
        
        if(boardTdElement.innerText===''){
            
            boardTdElement.classList.add('ans')
            boardTdElement.addEventListener('mousedown',e=>{
                document.querySelectorAll('.number-table').forEach((nT)=>{
                    nT.remove();
                });
                
                curTarget = e.target;
                var numberTableElement=this.numberTableConstruct();
                
                numberTableElement.style.left=e.clientX +"px";
                numberTableElement.style.top= e.clientY +"px";
    
                numberTableElement.addEventListener('mousedown',e2=>{
    
                    var reply = e2.target.innerText;
                    if(numRegExp.test(reply)){
                        curTarget.innerText=reply;
                    }else{
                        curTarget.innerText='';
                    }
                    numberTableElement.remove();
                })
                
            })
        }
        
    })

};

Board.prototype.numberTableConstruct=function(){
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
};

sudokuGame={
    boardContainer:function(){
        return document.getElementById('board')
    },
    unitOfBoard:function(){
        var uInCookie = getCookie('unit');
        var unitOfBoard;
        if (uInCookie===""){
            unitOfBoard=3;
        }else{
            unitOfBoard=parseInt(uInCookie);
        }
        return unitOfBoard;
    },

    sectionSetting:function(){
        var uInCookie = getCookie('secSet');
        var secSet;
        if (uInCookie===""){
            secSet='section-regular';
        }else{
            secSet=parseInt(uInCookie);
        }
        return secSet;
    },

    NewGame:function(){
        sudokuGame.solved=false
        var newBoard = new Board(sudokuGame.sectionSetting(),sudokuGame.unitOfBoard(),sudokuGame.boardContainer());
        newBoard.boardConstruct();
        sudokuGame.solution = newBoard.boardQuestion;
        var timerElement = document.querySelector('#timer')
        var sec=0;
        var min=0;
        timerElement.innerText='00:00'
        clearInterval(sudokuGame.timer)
        sudokuGame.timer = setInterval(function(){
            sec++
            if(sec==60){
                sec=0
                min++
            }
            timerElement.innerText=String(min).padStart(2,'0')+':'+String(sec).padStart(2,'0')
        },1000)

    },

    Clear:function(){
        
        if(document.getElementsByClassName('board-table').length!=0){
            document.querySelectorAll('.boardTd.ans').forEach((e)=>e.innerText="");
        }
    },

    Solve:function(){
        
        if(!sudokuGame.solved){
            var counter=0;
            sudokuGame.solution.forEach((x)=>{
                var sizeOfBoard=sudokuGame.unitOfBoard()**2;
                var r=Math.floor(counter/sizeOfBoard);
                var c=counter%sizeOfBoard;
                var e = document.querySelector('.boardTd.r'+r+'.c'+c);
                if(e.classList.contains('ans')){
                    if(e.innerText==""){
                        e.innerText=x
                    }else if(e.innerText==x){
                        e.style.color="#1d612f"
                    }else{
                        e.innerHTML=x
                    }
                }
                counter++
            })
        }
        sudokuGame.solved=true
    }
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  };

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  };

//adding the control functions
document.addEventListener('DOMContentLoaded', function(){

    var newGame = Object.create(sudokuGame);
    
    document.querySelectorAll('button').forEach((bttn)=>{
        var functionName = bttn.innerText.replace(' ','');
        bttn.onclick = newGame[functionName];
    });



})