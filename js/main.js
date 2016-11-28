////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
var map = null;
var markersArray = [];			/* 创建标记数组	 */
var clusterMarkersArray = [];	/* 聚合效果数组  */
var popupsArray = [];			/* 提示框数组	 */
var markerMsgArray = [];		/* 标注信息数组*/
var clusterSource = null;
var clusterVectorSource	= null;
var dragInteraction = null;
var popup = null;
var isCluster = false;
var planeMapMode = false;
var isEntityDrag = false;
var clusters = null;

$(function(){
    //初始化加载地图瓦片
    initialize();
	
	var time = null;
	/************************************************************************
    * 单击事件
    *************************************************************************/
    map.on('singleclick',function(event){
        var feature = map.forEachFeatureAtPixel(event.pixel,function(feature){
            //为移动到的feature发送自定义消息
			if(!isCluster)
            {
				feature.dispatchEvent({type:'mousedown',event:event});
				feature.dispatchEvent({type:'mouseup',event:event});
				feature.dispatchEvent({type:'singleclick',event:event});
            }
            return feature;
        });

		if(!feature)
		{
			var coordinate = map.getCoordinateFromPixel(event.pixel);
			var latlng = transCoordinateToLatlng(coordinate);
			window.Click(9,0,latlng.x,latlng.y);                     //9:传递地图左键click事件到CEF
			return;
		}
    });

    /************************************************************************
    * 双击事件
    *************************************************************************/
    map.on('dblclick',function(event){        
        var feature = map.forEachFeatureAtPixel(event.pixel,function(feature){
			//为移动到的feature发送dblclick消息
			if(!isCluster)
			{
				feature.dispatchEvent({type:'dblclick',event:event});   
			}
			return feature;
        });
    });

    /*************************************************************************
    *聚合效果的单击事件
    **************************************************************************/
    map.getViewport().addEventListener("click", function(e) {
        map.forEachFeatureAtPixel(map.getEventPixel(e), function (feature, layer) {
            if(!isCluster)
              return;
            if(feature.get('features').length == 1)
            {
				clearTimeout(time);
				//单击事件延时200ms触发
				time = setTimeout(function(){
					var coordinate = feature.getGeometry().getCoordinates();
					var latlng = transCoordinateToLatlng(coordinate);
					var id = parseInt(feature.get('features')[0].get('id'));
					window.Click(2,id,latlng.x,latlng.y);     //2:传递click事件到 CEF
				},200);
            }
        });
    });
    /*************************************************************************
    *聚合效果的mousedown事件
    **************************************************************************/
    map.getViewport().addEventListener("mousedown", function(e) {        
        var target = map.getTarget();
        var jTarget = typeof target === "string" ? $("#"+target) : $(target);
        jTarget.css('cursor','url("/mapfiles/closedhand.cur"),auto');
        var feature = map.forEachFeatureAtPixel(map.getEventPixel(e), function (feature, layer) {
			jTarget.css('cursor','url("/mapfiles/closedhand.cur"),auto');
			if(!isCluster){
				return feature;
			}
			if(feature.get('features').length == 1){
				var coordinate = feature.getGeometry().getCoordinates();
				var latlng = transCoordinateToLatlng(coordinate);
				var id = parseInt(feature.get('features')[0].get('id'));
				window.Click(5,id,latlng.x,latlng.y);     // 5:传递mousedown事件到 CEF				
				return feature;
			}
        });
		if(!feature){
			var coordinate = map.getCoordinateFromPixel(map.getEventPixel(e));
			var latlng = transCoordinateToLatlng(coordinate);
			window.Click(7,0,latlng.x,latlng.y);     // 7:传递地图mousedown事件到 CEF
		}
    });
    /*************************************************************************
    *聚合效果的mouseup事件
    **************************************************************************/
    map.getViewport().addEventListener("mouseup", function(e) {
        var target = map.getTarget();
        var jTarget = typeof target === "string" ? $("#"+target) : $(target);
        jTarget.css('cursor','url("/mapfiles/openhand.cur"),auto');        
        var feature = map.forEachFeatureAtPixel(map.getEventPixel(e), function (feature, layer) {                    
			if(!isCluster){
				return feature;
			}  
            if(feature.get('features').length == 1)
            {
              var coordinate = feature.getGeometry().getCoordinates();
              var latlng = transCoordinateToLatlng(coordinate);
              var id = parseInt(feature.get('features')[0].get('id'));
              window.Click(6,id,latlng.x,latlng.y);     // 6:传递mouseup事件到 CEF
            }
			return feature;
        });
		if(!feature){
			var coordinate = map.getCoordinateFromPixel(map.getEventPixel(e));
			var latlng = transCoordinateToLatlng(coordinate);
			window.Click(8,0,latlng.x,latlng.y);     // 8:传递地图mouseup事件到 CEF
		}
    });
    /*************************************************************************
    *聚合效果的dblclick事件
    **************************************************************************/
    map.getViewport().addEventListener("dblclick", function(e) {
        map.forEachFeatureAtPixel(map.getEventPixel(e), function (feature, layer) {
            if(!isCluster)
              return;
            if(feature.get('features').length == 1)
            {
				clearTimeout(time);
				var coordinate = feature.getGeometry().getCoordinates();
				var latlng = transCoordinateToLatlng(coordinate);
				var id = parseInt(feature.get('features')[0].get('id'));
				window.Click(3,id,latlng.x,latlng.y);     // 3:传递dblclick事件到 CEF
            }else
            {
				var coordinate = feature.getGeometry().getCoordinates();
				var zoom = map.getView().getZoom();
				map.getView().setZoom(zoom + 2);
				map.getView().setCenter(coordinate);
            }
        });
    });

    /************************************************************************
    * 监听contextmenu右键菜单事件
    *************************************************************************/
	map.getViewport().addEventListener('contextmenu', function (e) {
		e.preventDefault();
		var feature = map.forEachFeatureAtPixel(map.getEventPixel(e),
			function (feature, layer) {
				return feature;
			});
		if (feature) {      //marker右键事件
			if(isCluster)//聚合
			{
				var size = feature.get('features').length;
				if(size == 1)
				{
					var coordinate = feature.getGeometry().getCoordinates();              
					var latlng = transCoordinateToLatlng(coordinate);
					var id = parseInt(feature.get('features')[0].get('id'));
					window.Click(4,id,latlng.x,latlng.y);                    //4:传递marker的rightclick事件到CEF        
				}
			}
			else	//非聚合
			{
				var coordinate = feature.getGeometry().getCoordinates();              
				var latlng = transCoordinateToLatlng(coordinate);
				var id = parseInt(feature.get('id'));
				window.Click(4,id,latlng.x,latlng.y);                    //4:传递marker的rightclick事件到CEF
			}
		  
		}else 
		{
			var coordinate = map.getCoordinateFromPixel(map.getEventPixel(e));
			var latlng = transCoordinateToLatlng(coordinate);
			window.Click(10,0,latlng.x,latlng.y);                    //10:传递地图右键click事件到CEF
		}
	});
	
	map.on('pointerdrag',function(evt){
		var feature = map.forEachFeatureAtPixel(evt.pixel,function(feature) {
	        //为移动到的feature发送自定义消息
			jTarget.css('cursor','url("/mapfiles/closedhand.cur"),auto');
			var coordinate = feature.getGeometry().getCoordinates();
            var latlng = transCoordinateToLatlng(coordinate);
			var id = 0;
			if(isCluster){
				if(feature.get('features').length == 1){
					id = parseInt(feature.get('features')[0].get('id'));
				}
			}else{
				id = parseInt(feature.get('id'));
			}
			window.Click(12,id,latlng.x,latlng.y);         //12:传递marker dragend事件到CEF
        	window.MarkerModify(id,latlng.x,latlng.y);		//调用cef函数
	        return feature; 
	    });
	});

	var target = map.getTarget();
    var jTarget = typeof target === "string" ? $("#"+target) : $(target);
  	map.on('pointermove',function(evt){
		var coordinate = map.getCoordinateFromPixel(evt.pixel);
		var latlng = transCoordinateToLatlng(coordinate);
		$("#latlng span").text( latlng.x+ ',' + latlng.y);
	    var feature = map.forEachFeatureAtPixel(evt.pixel,function(feature) {
	        //为移动到的feature发送自定义消息
	        return feature; 
	    });
	    
	    var element = popup.getElement();
	    if (!feature) {
			jTarget.css('cursor','url("/mapfiles/openhand.cur"),auto');
			$(element).popover('destroy');
			return false; 
	    }
	    jTarget.css('cursor','pointer');
	    var coordinate = feature.getGeometry().getCoordinates();
	    var hdms = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
	    var x = hdms[0].toFixed(6);
	    var y = hdms[1].toFixed(6);
	    $(element).popover('destroy');
		var tipText = '';
		if(isCluster)
		{
			var size = feature.get('features').length;
			if(size == 1)
				tipText = feature.get('features')[0].get('tip');
			else
				return;
		}
		else
		{
			tipText = feature.get('tip');
		}
	    popup.setPosition(coordinate);
	    // the keys are quoted to prevent renaming in ADVANCED mode.
	    $(element).popover({
			'placement': 'top',
			'animation': false,
			'html': true,
			'content': tipText
	    });
	    $(element).popover('show');
	});
	
	//切换地图
	mapTypeToggle();
});

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//初始化加载地图瓦片
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
function initialize()
{
	//var center = ol.proj.fromLonLat([118.59416, 24.89473]);
	var center = ol.proj.fromLonLat([118.589412, 24.898147]);
	//var center = ol.proj.fromLonLat([118.580074, 24.861869]);
	
	//添加一个使用离线瓦片地图的层	
	 var tiles = [
		new ol.layer.Tile({
			source: new ol.source.XYZ({
				// 设置本地离线瓦片所在路径
				url: '/roadmap/{z}/{x}/{y}.png',
				wrapX:false
			})
		}),  
        new ol.layer.Tile({
			source: new ol.source.XYZ({
				//设置本地离线瓦片所在路径
				url: '/overlay_r/{z}/{x}/{y}.png',
				wrapX:false
			})
        }),
		/* new ol.layer.Image({
			source: new ol.source.ImageWMS({
			  ratio: 1,
			  url: 'http://localhost:8080/geoserver/TIF/wms',
			  params: {'FORMAT': 'image/png',
					   'VERSION': '1.1.1',  
					LAYERS: 'postgis:ways',
					STYLES: '',
			  }
			})
		})
		 new ol.layer.Tile({
			visible: true,
			source: new ol.source.TileWMS({
			  url: 'http://localhost:8080/geoserver/TIF/wms',
			  params: {'FORMAT': 'image/png', 
					   'VERSION': '1.1.1',
					   tiled: true,
					LAYERS: 'postgis:ways',
					STYLES: '',
			  }
			})
		}) */
    ]; 
 
	/* var format = 'image/png';
    var bounds = [118.018836, 36.804027,
                    118.060353, 36.847734];
	untiled = new ol.layer.Image({
        source: new ol.source.ImageWMS({
          ratio: 1,
          url: 'http://localhost:8080/geoserver/demo/wms',
          params: {'FORMAT': format,
                   'VERSION': '1.1.1',  
                LAYERS: 'demo:zibo',
                STYLES: '',
          }
        })
    });
    tiled = new ol.layer.Tile({
        visible: false,
        source: new ol.source.TileWMS({
          url: 'http://localhost:8080/geoserver/demo/wms',
          params: {'FORMAT': format, 
                   'VERSION': '1.1.1',
                   tiled: true,
                LAYERS: 'demo:zibo',
                STYLES: '',
          }
        })
    });  */

 /*
    var projection = ol.proj.get('EPSG:4326');
    var projectionExtent = projection.getExtent();
    var size = ol.extent.getWidth(projectionExtent) / 256;
    var resolutions = new Array(20);
    var matrixIds = new Array(20);
    for (var z = 0; z < 20; ++z) {
    	// generate resolutions and matrixIds arrays for this WMTS
       	resolutions[z] = size / Math.pow(2, z);
       	matrixIds[z] = z;
    }

    var tiles = [
    	new ol.layer.Tile({
            opacity: 0.7,
            source: new ol.source.WMTS({
              url: '',			  
              layer: '0',
              matrixSet: 'EPSG:4326',
              format: 'image/png',
              projection: projection,
              tileGrid: new ol.tilegrid.WMTS({
                origin: ol.extent.getTopLeft(projectionExtent),
                resolutions: resolutions,
                matrixIds: matrixIds
              }),
              style: 'default',
              wrapX: true
            })
        }),
        new ol.layer.Tile({
            opacity: 0.7,
            source: new ol.source.WMTS({
              url: '',
              layer: '0',
              matrixSet: 'EPSG:4326',
              format: 'image/png',
              projection: projection,
              tileGrid: new ol.tilegrid.WMTS({
                origin: ol.extent.getTopLeft(projectionExtent),
                resolutions: resolutions,
                matrixIds: matrixIds
              }),
              style: 'default',
              wrapX: true
            })
        })
    ]	  
	*/
	
	map = new ol.Map({
		interactions : ol.interaction.defaults({doubleClickZoom :false}),		
		layers:tiles,
		renderer: 'canvas',
        target: 'map',
        view: new ol.View({
          center: center,
          zoom: 11,
          minZoom:4,
          maxZoom:18
      	}),
      	logo:false
	});
	$('#roadmap').css('background','#0C87E6').css('color','#ffffff');
	popup = new ol.Overlay({
    	element:document.getElementById('popup'),
		offset:[0,-15]
  	});
  	map.addOverlay(popup);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：创建地图标记
//参数：无
//返回：无
//备注：CEF调用，画出标记
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function initMarker(markerId,markerLat,markerLng)
{
	var markerid = parseInt(markerId);
	var longitute = parseFloat(markerLng);
	var latitute = parseFloat(markerLat);
	if(latitute < -90 || latitute >= 90)
	{
		return;
	}
	if(longitute <= -180 || longitute > 180)
	{
		return;
	}
	var pos = ol.proj.transform([longitute,latitute],'EPSG:4326', 'EPSG:3857');

	var marker = new ol.Feature({
		geometry : new ol.geom.Point(pos),
		id : markerId,
		tip : '',
		name: '',
		icon: 'red.png',
		color:'red'
	});

	var markerSource = new ol.source.Vector({
  		features: [marker]
	});

	var markerLayer = new ol.layer.Vector({
		source: markerSource,
		style : function(feature) {
			var style = new ol.style.Style({
				image : new ol.style.Icon({
					src : '/mapfiles/markers2/' + feature.get('icon')
				}),
				text: new ol.style.Text({
					text: feature.get('name'),
					font: '12px serif',
					fill: new ol.style.Fill({color:feature.get('color')}),
					offsetY:20
				})
			})
			return style;
		}
	});
	
	map.addLayer(markerLayer);
	markersArray.push(marker);
	
	window.GetMarkerLatlng(markerid,latitute,longitute);	//将标记传到 CEF
	window.Click(1,markerid,latitute,longitute);			//传递回调消息(标记创建完成)

	marker.on('singleclick',function(event){
		var coordinate = this.getGeometry().getCoordinates();
	    var hdms = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
	    var x = parseFloat(hdms[0].toFixed(6));		//经度
	    var y = parseFloat(hdms[1].toFixed(6));		//纬度
	    var id = parseInt(this.get('id'));
	    window.Click(2,id,y,x);			//2:传递click事件到CEF
	});
	
	marker.on('dblclick',function(event){		
		var coordinate = this.getGeometry().getCoordinates();
	    var hdms = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
	    var x = parseFloat(hdms[0].toFixed(6));		//经度
	    var y = parseFloat(hdms[1].toFixed(6));		//纬度
	    var id = parseInt(this.get('id'));
	    window.Click(3,id,y,x);			//3:传递dblclick事件到CEF
	});
	
	marker.on('mousedown',function(event){
		var coordinate = this.getGeometry().getCoordinates();
	    var hdms = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
	    var x = parseFloat(hdms[0].toFixed(6));		//经度
	    var y = parseFloat(hdms[1].toFixed(6));		//纬度
	    var id = parseInt(this.get('id'));
	    window.Click(5,id,y,x);			//5:传递mousedwon事件到CEF
	});
	marker.on('mouseup',function(event){
		var coordinate = this.getGeometry().getCoordinates();
	    var hdms = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
	    var x = parseFloat(hdms[0].toFixed(6));		//经度
	    var y = parseFloat(hdms[1].toFixed(6));		//纬度
	    var id = parseInt(this.get('id'));
	    window.Click(6,id,y,x);			//6:传递mouseup事件到CEF
	});
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：创建带文本的地图标记
//参数：无
//返回：无
//备注：CEF调用，画出标记
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function markerWithLabel(markerId,markerLat,markerLng,label,textColor)
{
	var markerid = parseInt(markerId);
	var latitute = parseFloat(markerLat);
	var longitute = parseFloat(markerLng);
	if(latitute < -90 || latitute >= 90)
	{
		return;
	}
	if(longitute <= -180 || longitute > 180)
	{
		return;
	}

	var coordinate = new ol.proj.transform([longitute,latitute],'EPSG:4326', 'EPSG:3857');
	var marker = new ol.Feature({
		geometry : new ol.geom.Point(coordinate),
		id   : markerId,
		tip  : '',
		name : label,
		icon : 'red.png',
		color: textColor
	});

	clusterMarkersArray.push(marker);

	window.GetMarkerLatlng(markerid,latitute,longitute);
	window.Click(1,markerid,latitute,longitute);

	if(clusterVectorSource == null){
		clusterVectorSource = new ol.source.Vector({
			features:clusterMarkersArray
		});
		clusterSource = new ol.source.Cluster({
			source:clusterVectorSource
		});
		
		clusters = new ol.layer.Vector({
			source:clusterSource,
			style: function(feature){
				var size = feature.get('features').length;
				var imageUrl = "/mapfiles/markers2/";
				var imageSrc;
				var textText = size.toString();
				var textFill = new ol.style.Fill({color:'black'});
				var offsety = 0;
				if(size == 1){
					imageSrc = imageUrl + feature.get('features')[0].get('icon');
					textText = feature.get('features')[0].get('name');
					textFill = new ol.style.Fill({color:feature.get('features')[0].get('color')});
					offsety = 20;
				}else
				{
					var png = size <= 10? "m1.png" : size <= 50 ? "m2.png" : size <= 100 ? "m3.png" : size <= 500 ? "m4.png" : "m5.png";
					imageSrc = imageUrl + png;
				}
				var style = new ol.style.Style({
					image: new ol.style.Icon({
						src:imageSrc
					}),
					text: new ol.style.Text({
						text: textText,
						font: '12px serif',
						fill: textFill,
						offsetY:offsety
					})
				});
				return style;
			} 
		});
		map.addLayer(clusters);
	}else{
		clusterVectorSource.addFeature(marker);
	}

	isCluster = true;
	planeMapMode = false;
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：删除标记
//参数：markerid
//返回：无
//备注：CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function removeMarker(markerId)
{
	if(isCluster)
	{
		for(var i=0;i<clusterSource.getFeatures().length;i++)
		{
			for(var j=0;j<clusterSource.getFeatures()[i].get('features').length;j++)			
			{
				if(markerId == clusterSource.getFeatures()[i].get('features')[j].get('id'))
				{
					clusterSource.getSource().removeFeature(clusterSource.getFeatures()[i].get('features')[j]);
					clusterSource.getSource().refresh();
					for(var k=0;k<clusterMarkersArray.length;k++)
					{
						if(markerId == clusterMarkersArray[k].get('id'))
						{
							clusterMarkersArray.splice(k,1);
							return;
						}
					}
				}
			}			
		}
	}else if(planeMapMode){
		var entityLen = entityArray.length;
		var entityID = parseInt(markerId);
		for(var i=0;i<entityLen;i++){
			if(entityArray[i].id == entityID){
				var entityPos = entityArray[i].position;
				var x = entityPos[0];
				var y = entityPos[1];
				var mapName = entityArray[i].plane;
				if($('#' + mapName).css('display') != 'none'){
					var entityDivs = $('#' + mapName).find('.entity');
					var divCounts = entityDivs.length;
					for(var j=0;j<divCounts;j++){
						var _this = entityDivs[j];						
						var posX = getEntityPosition(_this).positionX;
						var posY = getEntityPosition(_this).positionY;
						if(posX.toFixed(6) == x.toFixed(6) && posY.toFixed(6) == y.toFixed(6)){
							$(_this).remove();
							entityArray.splice(i,1);
							return;
						}
					}
				}
			}
		}
	}else{
		if(markersArray && markersArray.length > 0)
		{
			for(var i = 0;i < markersArray.length;i++)
			{
				if(markerId == markersArray[i].get('id'))
				{
					var _this = markersArray[i];							
					var style = new ol.style.Style({});
					_this.setStyle(style);
					markersArray.splice(i,1);
					return;
				}
			}
		}
	}
	
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：固定显示信息
//参数：markerid,marername
//返回：无
//备注：CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function showMarkerName(markerid,markerName,nameColor)
{
	if(isCluster){
		var clusterLen = clusterSource.getFeatures().length;
		for(var i=0;i<clusterLen;i++)
        {
			var featuresLen = clusterSource.getFeatures()[i].get('features').length;
			for(var j=0;j<featuresLen;j++)
			{	
				if(markerid == clusterSource.getFeatures()[i].get('features')[j].get('id'))
				{
					var _this = clusterSource.getFeatures()[i].get('features')[j];
					_this.set('name',markerName);
					_this.set('color',nameColor);
					return;
				}
			}
        }
	}else if(planeMapMode){
		var entityObj = getEntityById(markerid);
		if($(entityObj.plane).css('display') != 'none'){
			$(entityObj).find('div').text(markerName);
			$(entityObj).find('div').css('color',nameColor);
		}
	}else{
		for(var n = 0;n < markersArray.length;n++)
		{
			if(markerid == markersArray[n].get('id'))
			{
				var _this = markersArray[n];
				_this.set('name',markerName);
				_this.set('color',nameColor);
				return;
			}	
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：改变图标
//参数：markerid：图标ID，iconName：图标文件名
//返回：无
//备注：CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function changeIcon(markerid,iconName)
{
	if(isCluster){
		var clusterLen = clusterSource.getFeatures().length;
		for(var i=0;i<clusterLen;i++)
        {
			var featuresLen = clusterSource.getFeatures()[i].get('features').length;
			for(var j=0;j<featuresLen;j++)
			{	
				if(markerid == clusterSource.getFeatures()[i].get('features')[j].get('id'))
				{
					var _this = clusterSource.getFeatures()[i].get('features')[j];
					_this.set('icon',iconName);
					return;
				}
			}
        }
	}else if(planeMapMode){	//平面图模式
		var entityObj = getEntityById(markerid);
		if(entityObj){
			$(entityObj).find('img').attr('src','mapfiles/markers/实体图/' + iconName);
		}
	}else{
		var iconUrl = '/mapfiles/markers2/' + iconName;
		for(var i=0;i<markersArray.length;i++)
		{
			if(markerid == markersArray[i].get('id'))
			{
				var _this = markersArray[i];
				_this.set('icon',iconName);
				return;
			}
		}	
	}	
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：图标闪烁
//参数：markerid：图标ID
//返回：无
//备注：CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function markerFlash(markerid,bgIconName,timeout,flashCount)
{
	var timeOut = parseInt(timeout);
	var count = parseInt(flashCount);
	var intervaltime = timeOut * 2;
	/* if(bgIconName == 'undefined' || bgIconName == '')
	{
		bgIconName = 'white.png';
	}
	var bgUrl = '/mapfiles/markers2/' + bgIconName; */
	if(isCluster)
	{
		for(var i=0;i<clusterSource.getFeatures().length;i++)
		{
			for(var j=0;j<clusterSource.getFeatures()[i].get('features').length;j++)
			{	
				if(markerid == clusterSource.getFeatures()[i].get('features')[j].get('id'))
				{
					var _this = clusterSource.getFeatures()[i].get('features')[j];
					flashListener(_this,count,intervaltime,timeOut);
				}
			}
		}

	}else if(planeMapMode){
		var entityObj = getEntityById(markerid);
		if(entityObj){
			entityObj.style.WebkitAnimation = "";
			entityObj.offsetWidth = entityObj.offsetWidth;
			entityObj.style.WebkitAnimation = "shinered " + timeOut/1000 + "s " + flashCount;
		}		
	}else{
		for(var i = 0;i < markersArray.length;i++)
		{
			if(markerid == markersArray[i].get('id'))
			{
				var _this = markersArray[i];
				flashListener(_this,count,intervaltime,timeOut);
			}
		}
	}
}

function flashListener(featureObj,count,intervaltime,timeOut){
	var _this = featureObj;
	if(_this.iFlashListener == null || _this.iFlashListener == 'undefined'){
		_this.iFlashListener = setInterval(function(){
			map.render();
			flash(_this.getGeometry());						
		},intervaltime);
		var allTime = 0;
		if(count == 0)
		{
			allTime = 0;
		}else if(count > 0 && count < 4294967295)
		{
			allTime = parseInt(intervaltime * count + timeOut);
		}
		else
		{
			return;
		}
		_this.timeOutListener = setTimeout(function(){
			relieveFlashListener(_this);
		},allTime);
	}
}

var duration = 2000;
function flash(geometry){
	var start = new Date().getTime();
	var listenerKey;
	function animate(event){
		var vectorContext = event.vectorContext;
		var frameState = event.frameState;
		var flashGeom = geometry.clone();
		var elapsed = frameState.time - start;
		var elapsedRatio = elapsed / duration;
		// radius will be 5 at start and 30 at end.
		var radius = ol.easing.easeOut(elapsedRatio) * 25 + 5;
		var opacity = ol.easing.easeOut(1 - elapsedRatio);
		var style = new ol.style.Style({
			image: new ol.style.Circle({
				radius: radius,
				snapToPixel: false,
				stroke: new ol.style.Stroke({
				color: 'rgba(255, 0, 0, ' + opacity + ')',
					width: 0.25 + opacity
				})
			})
		});
		vectorContext.setStyle(style);
		vectorContext.drawGeometry(flashGeom);
		if (elapsed > duration){
			ol.Observable.unByKey(listenerKey);
			return;
		}
		// tell OL3 to continue postcompose animation
		map.render();
	}
	listenerKey = map.on('postcompose', animate);
}

function relieveFlashListener(element){
	clearInterval(element.iFlashListener);
	clearTimeout(element.timeOutListener);
	element.iFlashListener = null;
	element.timeOutListener = null;
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：取消图标闪烁
//参数：markerid：图标ID
//返回：无
//备注：CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function cancelMarkerFlash(markerid)
{
	if(isCluster)
	{
		var clusterLen = clusterSource.getFeatures().length;
		for(var i=0;i<clusterLen;i++)
		{
			//if(clusterSource.getFeatures()[i].get('features').length == 1)
			var featuresLen = clusterSource.getFeatures()[i].get('features').length;
			for(var j=0;j<featuresLen;j++)
			{	
				if(markerid == clusterSource.getFeatures()[i].get('features')[j].get('id'))
				{
					var _this = clusterSource.getFeatures()[i].get('features')[j];
					if(_this.iFlashListener != null && _this.timeOutListener != null)
					{
						relieveFlashListener(_this);
						return;
					}
				}
			}
		}
	}else if(planeMapMode){
		var entityObj = getEntityById(markerid);
		entityObj.style.WebkitAnimation = "";
	}
	else
	{
		for(var i=0;i<markersArray.length;i++)
		{
			if(markerid == markersArray[i].get('id'))
			{
				var _this = markersArray[i];
				if(_this.iFlashListener != null && _this.timeOutListener != null)
				{
					relieveFlashListener(_this);
					return;
				}
			}
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：图标显示在地图中心
//参数：无
//返回：无
//备注：CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function showPositionCenter(markerid)
{
	if(isCluster)
	{
		for(var i=0;i<clusterSource.getFeatures().length;i++)
		{
			for(var j=0;j<clusterSource.getFeatures()[i].get('features').length;j++)
			{
				if(markerid == clusterSource.getFeatures()[i].get('features')[j].get('id'))
				{
					map.getView().setCenter(clusterSource.getFeatures()[i].get('features')[j].getGeometry().getCoordinates());
					return;
				}
			}			
		}
	}
	else
	{
		for(var i = 0;i<markersArray.length;i++)
		{
			if(markerid == markersArray[i].get('id'))
			{
				map.getView().setCenter(markersArray[i].getGeometry().getCoordinates());
				return;
			}
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：通过经纬度定位在地图中心
//参数：无
//返回：无
//备注：CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function locationPositionCenter(markerLat,markerLng)
{
	var longitute = parseFloat(markerLng);
	var latitute = parseFloat(markerLat);
	var coordinate = ol.proj.transform([longitute,latitute],'EPSG:4326', 'EPSG:3857');
	map.getView().setCenter(coordinate);
	var flashGeom = new ol.geom.Point(coordinate);
	flash(flashGeom);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：获取地图可视区中心
//参数：无
//返回：无
//备注：CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function getCenter(){
	var coordinate = map.getView().getCenter();
	var hdms = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
	var x = hdms[0].toFixed(6);	//经度
	var y = hdms[1].toFixed(6);	//纬度
	window.Click(16,0,parseFloat(y),parseFloat(x));
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：设置地图等级
//参数：无
//返回：无
//备注：CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function setMapLeval(leval)
{
	zoom = parseInt(leval);
	map.getView().setZoom(zoom);	
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：鼠标移入标记显示信息
//参数：无
//返回：无
//备注：CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function showInfoWindow(markerid,tipContent)
{
	if(isCluster){
		for(var i=0;i<clusterSource.getFeatures().length;i++)
		{
			for(var j=0;j<clusterSource.getFeatures()[i].get('features').length;j++)
			{
				if(markerid == clusterSource.getFeatures()[i].get('features')[j].get('id'))
				{
					var _this = clusterSource.getFeatures()[i].get('features')[j];
					_this.set('tip',tipContent);
					return;
				}
			}
		}
	}else if(planeMapMode){
		var len = entityArray.length;
		for(var i=0;i<len;i++){
			if(entityArray[i].id == parseInt(markerid)){
				entityArray[i].tip = tipContent;
				return;
			}
		}
	}
	else{
		var Len = markersArray.length
		for(var i=0;i<Len;i++){
			if(markersArray[i].get('id') == markerid){
				markersArray[i].set('tip',tipContent);
				return;
			}
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：画出路线
//参数：latitude:纬度
//		longitude:经度
//返回：无
//备注：CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
var closePoint = null;
function mapDrawPath(latitute,longitute){
	var latitute = parseFloat(latitute);
	var longitute = parseFloat(longitute);
	
	/* if(lineArray && lineArray.length > 0)
	{
		for(var i=0;i<lineArray.length;i++)
		{
			//map.removeLayer(lineArray[i]);
			lineArray[i] = null;
		}
	}
	
	//var coords = [[118.529091,24.861908], [118.575783,24.868138]];
	var coord = [longitute,latitute];
	coordsArray.push(coord);
	var len = coordsArray.length;
	
	if(len > 1)
	{
		var lineString = new ol.geom.LineString([coordsArray[len-1],coordsArray[len-2]]);
		// transform to EPSG:3857
		lineString.transform('EPSG:4326', 'EPSG:3857');
		lineArray.push(lineString);
		// create the feature
		var feature = new ol.Feature({
			geometry: lineString,
			name: 'Line'
		});

		var lineStyle = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: '#FF0000',
				width: 5
			})
		});

		var source = new ol.source.Vector({
			features: [feature]
		});
		var vector = new ol.layer.Vector({
			source: source,
			style: [lineStyle]
		});
		
		map.addLayer(vector);		
	} */
	if(closePoint != null)
	{	
		map.removeLayer(closePoint);
		closePoint = null;
	}
	
	var params = {
		LAYERS: 'mapmatching:mapmatching',
		FORMAT: 'image/png'
	};
	// The "start" and "destination" features.
	
	var startPoint = new ol.Feature();
	//var destPoint = new ol.Feature();

	// The vector layer used to display the "start" and "destination" features.
	//var vectorLayer = new ol.layer.Vector({
	//	source: new ol.source.Vector({
	//		features: [startPoint]//, destPoint]
	//	})
	//});
	//map.addLayer(vectorLayer);
	
	// A transform function to convert coordinates from EPSG:3857
	// to EPSG:4326.
	var transform = ol.proj.getTransform('EPSG:3857','EPSG:4326');
	var coordinate = new ol.proj.transform([longitute,latitute],'EPSG:4326', 'EPSG:3857');
	if (startPoint.getGeometry() == null) {
		// First click.
		
		startPoint.setGeometry(new ol.geom.Point(coordinate));
		var startCoord = transform(startPoint.getGeometry().getCoordinates());		
		var viewparams = [
			'x1:' + startCoord[0], 'y1:' + startCoord[1]
		];
		params.viewparams = viewparams.join(';');
		
		closePoint = new ol.layer.Image({
			source: new ol.source.ImageWMS({
				url : 'http://localhost:8080/geoserver/mapmatching/wms',
				params: params
			})
		});
		map.addLayer(closePoint);
	} 
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：转换坐标获取经纬度
//参数：无
//返回：无
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function transCoordinateToLatlng(coordinate){
	var hdms = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
	var longitude = parseFloat(hdms[0].toFixed(6));   //经度
    var latitude = parseFloat(hdms[1].toFixed(6));   //纬度
	return {
		x:latitude,
		y:longitude 
	};
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：切换地图类型
//参数：无
//返回：无
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function mapTypeToggle(){
	var projection = ol.proj.get('EPSG:4326');
	var projectionExtent = projection.getExtent();
	var size = ol.extent.getWidth(projectionExtent) / 256;
	var resolutions = new Array(20);
	var matrixIds = new Array(20);
	for (var z = 0; z < 20; ++z) {
	// generate resolutions and matrixIds arrays for this WMTS
	  resolutions[z] = size / Math.pow(2, z);
	  matrixIds[z] = z;
	}
	/* //矢量图
	$("#roadmap").click(function(){
		var layersroad = new ol.layer.Group({
			layers: [
				new ol.layer.Tile({
					opacity: 0.7,
					source: new ol.source.WMTS({
						url: '',
						layer: '0',
						matrixSet: 'EPSG:4326',
						format: 'image/png',
						projection: projection,
						tileGrid: new ol.tilegrid.WMTS({
							origin: ol.extent.getTopLeft(projectionExtent),
							resolutions: resolutions,
							matrixIds: matrixIds
						}),
						style: 'default',
						wrapX: true
					})
				}),
				new ol.layer.Tile({
					opacity: 0.7,
					source: new ol.source.WMTS({
						url: '',
						layer: '0',
						matrixSet: 'EPSG:4326',
						format: 'image/png',
						projection: projection,
						tileGrid: new ol.tilegrid.WMTS({
							origin: ol.extent.getTopLeft(projectionExtent),
							resolutions: resolutions,
							matrixIds: matrixIds
						}),
						style: 'default',
						wrapX: true
					})
				})
			]
		});
		map.setLayerGroup(layersroad);
		$('#satellite').css('background','').css('color','');
		$(this).css('background','#0C87E6').css('color','#ffffff');
		loadMarkers();
	});

      //影像图 
    $("#satellite").click(function(){
        var satellite = new ol.layer.Group({
            layers: [
				new ol.layer.Tile({
					opacity: 0.7,
					source: new ol.source.WMTS({
						url: '',
						layer: '0',
						matrixSet: 'EPSG:4326',
						format: 'image/png',
						projection: projection,
						tileGrid: new ol.tilegrid.WMTS({
							origin: ol.extent.getTopLeft(projectionExtent),
							resolutions: resolutions,
							matrixIds: matrixIds
						}),
						style: 'default',
						wrapX: true
					})
              }),
              new ol.layer.Tile({
					opacity: 0.7,
					source: new ol.source.WMTS({
						url: '',
						layer: '0',
						matrixSet: 'EPSG:4326',
						format: 'image/png',
						projection: projection,
						tileGrid: new ol.tilegrid.WMTS({
							origin: ol.extent.getTopLeft(projectionExtent),
							resolutions: resolutions,
							matrixIds: matrixIds
						}),
						style: 'default',
						wrapX: true
					})
				})  
            ]
        });
        map.setLayerGroup(satellite);
        $('#roadmap').css('background','').css('color','');
        $(this).css('background','#0C87E6').css('color','#ffffff');
        loadMarkers();
	}); */ 
	
	//矢量图
    $("#roadmap").click(function(){
        var layersroad = new ol.layer.Group({
            layers: [
              new ol.layer.Tile({
                source: new ol.source.XYZ({
              // 设置本地离线瓦片所在路径
                  url: '/roadmap/{z}/{x}/{y}.png'
                })
              }),  
              new ol.layer.Tile({
                source: new ol.source.XYZ({
              // 设置本地离线瓦片所在路径
                  url: '/overlay_r/{z}/{x}/{y}.png'
                })
              })
            ]
        });
        map.setLayerGroup(layersroad);
        $('#satellite').css('background','').css('color','');
        $(this).css('background','#0C87E6').css('color','#ffffff');
        loadMarkers();
    });

    //影像图
    $("#satellite").click(function(){
        var satellite = new ol.layer.Group({
            layers: [
				new ol.layer.Tile({
					source: new ol.source.XYZ({
						// 设置本地离线瓦片所在路径
						url: '/satellite/{z}/{x}/{y}.jpg'
					})
				}),
				new ol.layer.Tile({
					source: new ol.source.XYZ({
						// 设置本地离线瓦片所在路径
						url: '/overlay_r/{z}/{x}/{y}.png'
					})
				})
            ]
        });
        map.setLayerGroup(satellite);
        $('#roadmap').css('background','').css('color','');
        $(this).css('background','#0C87E6').css('color','#ffffff');
        loadMarkers();
    });
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：切换地图加载标注
//参数：无
//返回：无
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function loadMarkers()
{
	if(!isCluster)
	{
		var markerSource = new ol.source.Vector({
		  features: markersArray
		});

		var markerLayer = new ol.layer.Vector({
			source: markerSource,
			style : function(feature) {
				var style = new ol.style.Style({
					image : new ol.style.Icon({
						src : '/mapfiles/markers2/' + feature.get('icon')
					}),
					text: new ol.style.Text({
						text: feature.get('name'),
						font: '12px serif',
						fill: new ol.style.Fill({color:feature.get('color')}),
						offsetY:20
					})
				})
				return style;
			}
		});
		map.addLayer(markerLayer);
	}
	else{
		if(clusterVectorSource)
		{
		  clusterVectorSource.clear();  // 清理所有features
		  clusterVectorSource = null;
		}
		clusterVectorSource = new ol.source.Vector({
		  features:clusterMarkersArray
		}); 
		
		if(clusterSource != null)
		{
		  clusterSource.clear();      // 清理所有features 
		  clusterSource = null;
		}
		clusterSource = new ol.source.Cluster({   
		  source:clusterVectorSource
		});
		
		var styleCache = {};  
		clusters = new ol.layer.Vector({
			source:clusterSource,
			style: function(feature) {			
				var size = feature.get('features').length;			
				var imageUrl = "/mapfiles/markers2/";
				var imageSrc;
				var textText = size.toString();
				var textFill = new ol.style.Fill({color:'black'});
				var offsety = 0;
				if(size == 1){
					imageSrc = imageUrl + feature.get('features')[0].get('icon');
					textText = feature.get('features')[0].get('name');
					textFill = new ol.style.Fill({color:feature.get('features')[0].get('color')});
					offsety = 20;
				}else
				{
					var png = size <= 10? "m1.png" : size <= 50 ? "m2.png" : size <= 100 ? "m3.png" : size <= 500 ? "m4.png" : "m5.png";
					imageSrc = imageUrl + png;
				}
				var style = new ol.style.Style({
					image: new ol.style.Icon({
						src:imageSrc
					}),
					text: new ol.style.Text({
						text: textText,
						font: '12px serif',
						fill: textFill,
						offsetY:offsety               
					})
				});
				//styleCache[size] = style;
				return style;
			}
		});      
		map.addLayer(clusters);
	}
}

/****************************************************************************************************************************
*****************************************************************************************************************************
*****************************************************************************************************************************/

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：添加平面图
//参数：mapName : 平面图名称
//返回：无
//备注: CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function createPlaneMap(mapName){
	var time = null;
	var  mapid = mapName.split('.')[0];
	if(!document.getElementById(mapid)){
		var div = "<div id='"+ mapid +"' class='map' style='position:relative;width:100%;height:100%;display:none;-webkit-user-select:none;'></div>";
		$('body').append(div);
		var selector = '#' + mapid;
		$(selector).css('background','url(mapfiles/markers/平面图/'+ mapName +')').css('background-size','100% 100%');		
		
		planeMapMode = true; 	//平面图模式[全局变量]
		isCluster = false;		//聚合模式[全局变量]
		
		planeMapEvent(selector);	//平面图事件监听
		
		//绑定实体单击事件
		$(selector).on('click','div',function(e){
			e.stopPropagation();
			//清除延时触发的事件
			clearTimeout(time);
			//单击事件延时300ms触发
			time = setTimeout(function(){
				var element = e.target.parentNode;
				var x = getEntityPosition(element).positionX;
				var y = getEntityPosition(element).positionY;
				var id = getEntityId(x,y);
				window.Click(2,id,x,y);
			},200);
		});

		//绑定实体双击事件
		$(selector).on('dblclick','div',function(e){
			e.stopPropagation();
			//清除延时触发的事件
			clearTimeout(time);
			//双击事件的具体操作
			var element = e.target.parentNode;
			var x = getEntityPosition(element).positionX;
			var y = getEntityPosition(element).positionY;
			var id = getEntityId(x,y);
			window.Click(3,id,x,y);
		});
		//实体拖动效果
		$(selector).on('mousedown','div',function(e){
			e.preventDefault();
			e.stopPropagation();
			var _this = e.target.parentNode;
			$(_this).css('cursor','url("/mapfiles/closedhand.cur"),auto');
			var isDrag = isEntityDrag;
			var originX = e.pageX;
			var originY = e.pageY;
			var left = parseFloat($(_this).css('left').split('p')[0]);
			var top = parseFloat($(_this).css('top').split('p')[0]);	
			var width = parseFloat($(e.target).css('width').split('p')[0]);
			var height = parseFloat($(e.target).css('height').split('p')[0]);
			var entityX = getEntityPosition(_this).positionX;
			var entityY = getEntityPosition(_this).positionY;
			var id = getEntityId(entityX,entityY);
			window.Click(5,id,entityX,entityY);
			
			$(_this).mouseup(function(e){
				e.stopPropagation();
				isDrag = isEntityDrag;
				var upX = getEntityPosition(e.target.parentNode).positionX;
				var upY = getEntityPosition(e.target.parentNode).positionY;
				var id = getEntityId(upX,upY);
				window.Click(6,id,upX,upY); 	//实体mouseup
				//传值到CEF
				window.MarkerModify(id,upX,upY);//调用cef函数
				$(selector).off('mousemove');
				$(_this).off('mouseup');
				$(e.target.parentNode).css('cursor','pointer');
			});
			
			$(selector).mousemove(function(e){
				e.stopPropagation();
				if(isDrag){
					$(e.target.parentNode).popover('show');
					var x = left + e.pageX - originX;
					var y = top + e.pageY - originY;
					var positionX = (left + e.pageX - originX)/document.documentElement.clientWidth * 100;
					var positionY = (top + e.pageY - originY)/document.documentElement.clientHeight * 100;
					window.Click(12,id,parseFloat(positionX),parseFloat(positionY)); //实体拖动
					$(_this).css('left',positionX+'%').css('top',positionY+'%');
					var entityCounts = entityArray.length;
					for(var i=0;i<entityCounts;i++){
						if(entityArray[i].id == id){
							entityArray[i].position = [positionX,positionY];
						}
					}
				}
			});
		});
		/* document.getElementById(mapid).oncontextmenu = function(e){		//右键
			e.preventDefault();		
			var element = e.target.parentNode;
			if($(element)[0].tagName == 'BODY'){
				var x = e.pageX/document.documentElement.clientWidth*100;
				var y = e.pageY/document.documentElement.clientHeight*100;
				window.Click(10,0,x,y);
			}else if($(element)[0].tagName == 'DIV' && $(element).attr('class').match('entity') == 'entity' ){
				var x = getEntityPosition(element).positionX;
				var y = getEntityPosition(element).positionY;
				var id = getEntityId(x,y);
				window.Click(4,id,x,y);
			}
		}; */
		/* document.onmousewheel = function(e){
			e=e || window.event;
			if(e.wheelDelta > 0){
				$('body div.map').css('width',parseFloat($('body div.map').css('width').split('px')[0]) + 10 + 'px');
				$('body div.map').css('height',parseFloat($('body div.map').css('height').split('px')[0]) + 10 + 'px');
			}else{
				$('body div.map').css('width',parseFloat($('body div.map').css('width').split('px')[0] - 10) + 'px');
				$('body div.map').css('height',parseFloat($('body div.map').css('height').split('px')[0] - 10) + 'px');
			}
		} */
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：切换平面图
//参数：mapName : 平面图名称
//返回：无
//备注: CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function switchPlaneMap(mapName){
	var mapid;
	if(mapName == 'map'){
		planeMapMode = false;
		isCluster = true;
		mapid = mapName;
	}else{
		mapid = mapName.split('.')[0];
	}
	var divs = document.getElementsByClassName('map');
	var divCount = divs.length;
	for(var i=0;i<divCount;i++){
		$(divs[i]).css('display','none');
	}
	var selector = '#' + mapid;
	$(selector).show();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：改变平面图背景图
//参数：mapName : 平面图名称
//返回：无
//备注: CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function changePlaneMapBackground(mapName,background){
	var mapid;
	if(mapName == 'map'){
		return;
	}else{
		mapid = mapName.split('.')[0];
	}
	if(document.getElementById(mapid)){
		$('#'+mapid).css('background','url(mapfiles/markers/平面图/'+ background +')').css('background-size','100% 100%');
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：创建平面图实体
//参数：mapName	   	: 平面图名称
//		entityId   	: 实体ID
//		entityImg  	: 实体图片
//		entityWidth	: 实体宽度
//		entityHeight: 实体高度
//		entityX		: 实体左偏移量
//		entityY		: 实体顶部偏移量
//		entityText	: 实体文本
//		textColor	: 文本颜色
//返回：无
//备注: CEF调用
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
var entityArray = [];
function createEntity(mapName,entityId,entityImg,entityWidth,entityHeight,entityX,entityY,entityText,textColor){
	var winWidth = document.documentElement.clientWidth;
	var winHeight = document.documentElement.clientHeight;
	var maxLeft = (winWidth - entityWidth)/winWidth * 100;
	var maxTop = (winHeight - entityHeight)/winHeight * 100;	
	if(entityX < 0 || entityX > maxLeft || entityY < 0 || entityY > maxTop){
		return;
	}
	var mapid = mapName.split('.')[0];
	if(!document.getElementById(mapid))
		return;
	var entityPath = "<img src='mapfiles/markers/实体图/" + entityImg + 
					 "' width='" + entityWidth + "' height='" + entityHeight + "' />";
	
	var contentLeft = -100 + entityWidth/2;
	var contentTop = entityHeight;
	var contentDiv = "<div style='position:absolute;width:200px;left:" + contentLeft + "px;top:" + 
					 contentTop + "px;text-align:center;font:12px serif;color:" + textColor + ";'>"+entityText+"</div>";
	var entityDiv = "<div class='entity' style='position:absolute;left:" + entityX + "%;top:" + entityY + "%;'>"  
					+ entityPath + contentDiv +" </div>";
	$('#'+mapid).append(entityDiv);	
	var x = parseFloat(entityX);
	var y = parseFloat(entityY);
	var entityId = parseInt(entityId);
	window.GetMarkerLatlng(entityId,x,y);
	window.Click(1,entityId,x,y);
	var entityObj = {
		plane : mapid,
		id	  : entityId,
		name  : entityImg,
		tip   : '',
		text  : entityText,
		color : textColor,
		position : [x,y]
	};
	entityArray.push(entityObj);
	entityOverEvent(mapid);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：平面图鼠标事件
//参数：selector : 地图元素<div>的id
//返回：无
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function planeMapEvent(selector){
	$(selector).on({
		mousedown : function(e){
			var x = e.pageX/document.documentElement.clientWidth*100;
			var y = e.pageY/document.documentElement.clientHeight*100;
			window.Click(7,0,x,y);
		},
		mouseup	  : function(e){
			var x = e.pageX/document.documentElement.clientWidth*100;
			var y = e.pageY/document.documentElement.clientHeight*100;
			window.Click(8,0,x,y);
		},
		click : function(e){
			var x = e.pageX/document.documentElement.clientWidth*100;
			var y = e.pageY/document.documentElement.clientHeight*100;
			window.Click(9,0,x,y);
		},
	});	
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：平面图实体鼠标移动事件
//参数：mapName : 平面图名称
//返回：无
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function entityOverEvent(mapid){
	var time = null;
	var entitySelector = "#" + mapid + " .entity";
	$(entitySelector).mouseover(function(e){
		e.stopPropagation();
		var that = e.target.parentNode;
		$(entitySelector).css('cursor','pointer');
		var x = getEntityPosition(that).positionX;
		var y = getEntityPosition(that).positionY;
		var id = getEntityId(x,y);
		var entityText = '';
		var len = entityArray.length;
		for(var i=0;i<len;i++){
			if(entityArray[i].id == id){
				entityText = entityArray[i].tip;
			}
		}
		$(that).popover({
			'placement': 'top',
			'animation': false,
			'html': true,
			'content': entityText
	    });
		$(that).popover('show');
		if($(".popover") && (entityText != '') && ($(".popover").css('top').split('px')[0] < 0) ){
			$(that).popover('destroy');
			$(that).popover({
				'placement': 'bottom',
				'animation': false,
				'html': true,
				'content': entityText
			});
			$(that).popover('show');
		}
	});
	$(entitySelector).mouseout(function(e){
		e.stopPropagation();
		var that = e.target.parentNode;
		$(entitySelector).css('cursor','');
		$(that).popover('destroy');
	});
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：获取实体中心位置
//参数：element : 实体元素
//返回：无
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function getEntityPosition(element){
	var	elementLeft   = parseFloat(element.style.left.split('%')[0]);
	var	elementTop    = parseFloat(element.style.top.split('%')[0]);
	return {
		positionX : elementLeft,
		positionY : elementTop
	};
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：获取实体id
//参数：entityX : 实体左边偏移量
//		entityY : 实体顶部偏移量
//返回：实体id
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function getEntityId(entityX,entityY){
	for(var i=0;i<entityArray.length;i++){
		if(entityArray[i].position[0].toFixed(6) == entityX.toFixed(6) && entityArray[i].position[1].toFixed(6) == entityY.toFixed(6)){
			return entityArray[i].id;
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：获取实体id
//参数：entityX : 实体左边偏移量
//		entityY : 实体顶部偏移量
//返回：实体id
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function getEntityById(entityId){
	var entityLen = entityArray.length;
	var entityID = parseInt(entityId);
	for(var i=0;i<entityLen;i++){
		if(entityArray[i].id == entityID){
			var entityPos = entityArray[i].position;			
			var x = entityPos[0];
			var y = entityPos[1];
			var mapName = entityArray[i].plane;
			if($('#' + mapName).css('display') != 'none'){
				var entityDivs = $('#' + mapName).find('.entity');
				var divCounts = entityDivs.length;
				for(var j=0;j<divCounts;j++){
					var _this = entityDivs[j];
					var posX = getEntityPosition(_this).positionX;
					var posY = getEntityPosition(_this).positionY;
					if(posX.toFixed(6) == x.toFixed(6) && posY.toFixed(6) == y.toFixed(6)){
						return _this;
					}
				}
			}
		}
	}
}

