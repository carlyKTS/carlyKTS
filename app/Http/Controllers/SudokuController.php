<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SudokuController extends Controller
{
    public function index(){
        $question = [];
        return view('sudoku',compact('question'));
    }
}