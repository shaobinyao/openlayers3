//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//功能：创建地图标记
//参数：无
//返回：无
//备注：CEF调用，画出标记
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
/* function initMarker(markerId,markerLat,markerLng)
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
} */
