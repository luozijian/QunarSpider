if (typeof jQuery == 'undefined') {
    console.log("无jquery");
}
$("<iframe src="+window.location.href+" width='400px' height='400px' id='qunarFrame' name='qunarFrame'></iframe>").prependTo('body');
$('#qunarFrame').get(0).onload = function () {
    var is_onload = false;
    setTimeout(test(this,is_onload),1000);

};
function _test(context,is_onload) {
    return function () {
        test(context,is_onload);
    }
}

function randomNum(minNum,maxNum){
    switch(arguments.length){
        case 1:
            return parseInt(Math.random()*minNum+1);
            break;
        case 2:
            return parseInt(Math.random()*(maxNum-minNum+1)+minNum);
            break;
        default:
            return 0;
            break;
    }
}

function test(context,is_onload){
    var city = 'shenzhen';//可修改
    var url = 'http://hotel.qunar.com/city/'+city+'/dt-';
    var near_hotel = url;
    var hotel = {};

    var win = context.contentWindow;
    var match = context.src.match(/dt-\d+/);
    var hotel_id = city + '_' + match[0].substring(3);
    var redirect_id = match[0].substring(3);

    var flag = 0;
    var random = 0;
    var type = '';

    //周边酒店
    if(win.$('.e-recommend-list').length > 0){
        random = randomNum(1,win.$('.e-recommend-list').length);
        flag = 0;
        win.$('.e-recommend-list').each(function () {
            flag++;
            if(random == flag){
                console.log('民宿');
                type = '民宿';
                near_hotel = $(this).find('.e-panel-body dl dt a').attr('href');
            }
        });
    }
    if(win.$('.js_rem_hotel_show').length > 0){
        random = randomNum(1,win.$('.js_rem_hotel_show').length);
        flag = 0;
        win.$('.js_rem_hotel_show').each(function () {
            flag++;
            if(random == flag){
                console.log('酒店');
                type = '酒店';
                near_hotel = $(this).find('.txt h4 a').attr('href');
            }
        });
    }
    hotel.id = hotel_id;
    if(!is_onload){
        console.log('onload!');
        if(win.$('.noHotelInfoContainer').length > 0){
            console.log('酒店不存在');
            $("#qunarFrame").attr("src", near_hotel);
            return;
        }
        if(win.$('.waring-icon').length > 0){
            console.log('酒店停业');
            $("#qunarFrame").attr("src", near_hotel);
            return;
        }
        if(win.$('.js_no_com').length > 0){
            console.log('酒店无评论');
            $("#qunarFrame").attr("src", near_hotel);
            return;
        }

        hotel.name = win.$('.htl-info').find('h2 span').text();
        if(win.$('.b-baseinfo-title').length > 0){
            hotel.name = win.$('.b-baseinfo-title').find('h2 span').text();
        }

        var score = win.$('.score');
        if(score.hasClass('no_score')){
            hotel.goods_rate= win.$('.no_score').text();
        }else{
            hotel.goods_rate= score.find('span').text();
        }

        if(win.$('.js-positiveCount').length > 0){
            hotel.goods_count = (win.$('.js-positiveCount').text().match(/\d+/))[0];
            hotel.mids_count = (win.$('.js-neutralCount').text().match(/\d+/))[0];
            hotel.bads_count = (win.$('.js-negativeCount').text().match(/\d+/))[0];
        }

        if(win.$('#toRoomtool').length > 0){
            hotel.price = win.$('#toRoomtool').find('.pr b').text();
        }
        hotel.specialist_comment_count = win.$('#jt_guru').find('em').text();
        if(win.$('.score_rank').length > 0){
            hotel.score_rank = (win.$('.score_rank').find('strong').text().match(/第\d+/))[0].substr(1);
        }


        $.getJSON('http://localhost/QunarSpider/demo/store_hotel.php?jsoncallback=?',hotel,function(result){
            console.log(result);
            if(result.res == '失败'){
                $("#qunarFrame").attr("src", near_hotel);
            }
        });
    }



    var data = {};
    var length = win.$('.b_ugcfeed').length;
    console.log('当前页面评论数:'+length);
    if(length == 0){
        $("#qunarFrame").attr("src", near_hotel);
    }

    var count = 0;
    win.$('.b_ugcfeed').map(function(index, value){
        var el = $(value);
        data.id = el.data('id');

        data.hotel_id = hotel_id;

        data.usernickname = el.find('.usernickname a').text();
        data.userlevel = el.find('.userlevel a').text();

        data.userstat = [];
        el.find('.userstat li').each(function(index){
            data.userstat[index] = $(this).text();
        });

        data.title = el.find('.title a').text();
        data.like_count = el.find('.js_like_count').text();
        data.reply_count = el.find('.js_reply_count').text();
        if(win.$('.recommend').length > 0){
            data.star = 100;
        }else if(win.$('.in').length > 0){
            data.star = el.find('.in').attr('style');
        }
        // data.comment = el.find('.js-content').text();
        data.comment = el.find('.title a').attr('href');


        var reg_checkin = /\d+年/;
        el.find('.js-checkin li').each(function(){
            var text =$(this).text();
            if(text){
                if(reg_checkin.test(text)){
                    data.checkin_time = text;
                }else{
                    data.checkin_reason = text;
                }
            }
        });
        data.from = el.find('.from').text();

        var next = false;
        $.getJSON('http://localhost/QunarSpider/demo/store_user.php?jsoncallback=?',data,function(result){
            console.log(result);
            count++;
            console.log(count);
            if(count == length){
                win.$('.js-pager').find('.ui-page ul li').each(function () {
                    if($(this).hasClass('next')) {
                        console.log('下一页');
                        next = true;
                        is_onload = true;
                        win.$(this).find('a').trigger('click');
                        setTimeout(_test(context,is_onload),500);
                    }
                });
                if(!next){
                    console.log('没有下一页了，正在跳转周边酒店');
                    if(type == '民宿'){
                        $("#qunarFrame").attr("src", url+(++redirect_id)+'/');
                    }else{
                        $("#qunarFrame").attr("src", near_hotel);
                    }
                }
            }
        });
    });
}