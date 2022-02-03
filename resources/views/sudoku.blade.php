<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="{{ asset('css/app.css') }}" rel="stylesheet">
  <link href="{{ asset('css/custom.css') }}" rel="stylesheet">
  <script type="text/javascript" src="{{ asset('js/sudoku.js') }}"></script>
  
  <title> Sudoku </title>
</head>
<body class="bg-zinc-900">

    <h1 class="text-3xl font-bold text-center text-zinc-200">
      Sudoku
    </h1>
    <div class="text-zinc-800 text-center h-1/6" id="bttns">
          
      <button type="button" class="w-1/6 h-1/6 m-1.5 bg-gray-200 hover:bg-gray-300" onclick="Clear()">Clear</button>
      <button type="button" class="w-1/6 h-1/6 m-1.5 bg-gray-200 hover:bg-gray-300" onclick="ClearNote()">Clear Note</button>
      <button type="button" class="w-1/6 h-1/6 m-1.5 bg-gray-200 hover:bg-gray-300" onclick="NewGame()">New Game</button>
      <button type="button" class="w-1/6 h-1/6 m-1.5 bg-gray-200 hover:bg-gray-300" onclick="Hint()">Hint</button>
      <button type="button" class="w-1/6 h-1/6 m-1.5 bg-gray-200 hover:bg-gray-300" onclick="Solve()">Solve</button>

    </div>
    <div class="conatiner items-center">
      <div class="text-center mx-2.5 text-zinc-50 text-xl my-1" id="timer">
        OO:OO
      </div>
      <div class="items-center text-zinc-50" id="board">
        
      </div>
    </div>

</body>
</html>