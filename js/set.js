
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：标记是否拖动
//参数：flag :true/false
//返回：无
//备注：CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
var dragInteractionArray = [];
function markersIsDraggable(flag)
{
	if(isCluster)
	{
		if(flag == 'true')
		{
			for(var i=0;i<clusterSource.getFeatures().length;i++)
			{
				if(clusterSource.getFeatures()[i].get('features').length == 1)
				//for(var j=0;j<clusterSource.getFeatures()[i].get('features').length;j++)
				{
					var dragInteraction = new ol.interaction.Modify({
					    features: new ol.Collection(clusterSource.getFeatures()[i].get('features')),
					    style: new ol.style.Style({})
					});
					map.addInteraction(dragInteraction);
					dragInteractionArray.push(dragInteraction);						
				}
			}
		}
		else if(flag == 'false')
		{
			for(var i=0;i<dragInteractionArray.length;i++)
			{
				map.removeInteraction(dragInteractionArray[i]);
			}
			dragInteractionArray = [];
		}
	}else if(planeMapMode){
		if(flag == 'true'){
			isEntityDrag = true;
		}else if(flag == 'false'){
			isEntityDrag = false;
		}
	}
	else
	{
		if(flag == 'true')
		{
			dragInteraction = new ol.interaction.Modify({
			    features: new ol.Collection(markersArray),
			    style: new ol.style.Style({})
			});
			map.addInteraction(dragInteraction);
		}
		else if(flag == 'false')
		{
			map.removeInteraction(dragInteraction);		
		}
	}
}


