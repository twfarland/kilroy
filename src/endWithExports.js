
root.Kilroy = Kilroy;

root.KilroyUnits = {};

var toExpose = [

	// utils
	isNested, isTag, exists, contains, insertBeforeIndex, hasSameTagAndId,

	// vDom
	prepVDomTag, prepAttributeShorthand, prepChildren, prepChild, 
	vDomToHtmlString, htmlStringToDom, vDomToDom, 
	updateDom, updateAttributes, updateChildrenPairwise, updateChildrenKeyed
];

for (var i = 0; i < toExpose.length; i++) {
	root.KilroyUnits[toExpose[i].name] = toExpose[i];
}

}).call(this);