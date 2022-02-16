function checkbox(parent, id, text, checked=false, disabled=false, onchange=null){
	var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.id = id;
    checkbox.checked = checked;
    checkbox.disabled = disabled;
    checkbox.onchange = onchange;

    var label = document.createElement('label');
    label.htmlFor = id;
    label.appendChild(document.createTextNode(text));
      
    parent.appendChild(checkbox);
    parent.appendChild(label);

    return checkbox;
}

function br(parent){
	var br = document.createElement('br');
	parent.appendChild(br)
}

function hr(parent){
	var br = document.createElement('hr');
	parent.appendChild(br)
}

function select(parent, id, text, items, disabled=false, onchange=null){
	var select = document.createElement('select');          
    select.id = id;
    select.disabled = disabled;
    select.style = 'float: right;';
    select.onchange = onchange;
    
    for(let item of items){
    	var option = document.createElement('option');
    	option.value = item.value;
    	option.innerHTML = item.label;
    	select.appendChild(option);
    }

    var label = document.createElement('label');
    label.htmlFor = id;
    label.appendChild(document.createTextNode(text));
      
    parent.appendChild(label);
    parent.appendChild(select);

    return select;
}

function labeledTextbox(parent, id, labelText, textboxText='', size=20, disabled = false, readOnly=false, onchange=null){
	var input = document.createElement('input');          
    input.id = id;
    input.disabled = disabled;
    input.size = size;
    input.value = textboxText;
    input.style = 'text-align: right; float: right;';
    input.readOnly = readOnly;
    input.onchange = onchange

    var label = document.createElement('label');
    label.htmlFor = id;
    label.appendChild(document.createTextNode(labelText));
    
    parent.appendChild(label);
    parent.appendChild(input);

    return input;
}

function textarea(parent, id, text){
	var textarea = document.createElement('textarea');
	textarea.id = id;
	textarea.value = text;
	parent.appendChild(textarea);
	return textarea;
}

function button(parent, id, text, onclick=null){
	let button = document.createElement('input');
	button.id = id;
	button.type = 'button'
	button.value = text;
	button.onclick = onclick;
	parent.appendChild(button);
	return button
}

function colorpicker(parent, id, initialValue){
	let colorpicker = document.createElement('input');
	colorpicker.id = id;
	colorpicker.type = 'color'
	colorpicker.value = initialValue;
	colorpicker.valueFormat = 'rgb'
	parent.appendChild(colorpicker);
	return colorpicker
}

function range(parent, id, min, max, initialValue){
    let range = document.createElement('input');
    range.id = id;
    range.type = 'range'
    range.value = initialValue;
    range.min = min;
    range.max = max;
    parent.appendChild(range);
    return range
}

function onRangeChange(r,f) {
  var n,c,m;
  r.addEventListener("input",function(e){n=1;c=e.target.value;if(c!=m)f(e);m=c;});
  r.addEventListener("change",function(e){if(!n)f(e);});
}