var iframe_d_header_fun_maxmin_is = false
var iframe_d_list = []

function iframe_d_open(list) {
    let iframe_d = $(".iframe_d")
    if(iframe_d.html() != ""){
        iframe_d.css("display","flex");
        $(".iframe_d_mask").css("display", "block")
        return;
    }

    iframe_d_list = list
    $(".iframe_d").css({ "display": "flex", "z-index": iframe_d_list.z_index})

    var iframe_d_html =
        "<div class='iframe_d_mask' onclick='javascript:iframe_d_mask()'></div>" +
        "<div class='iframe_d_form'>" +
            "<div class='iframe_d_header'> " +
                "<div class='iframe_d_header_text'>" + iframe_d_list.title + "</div> " +
                "<div class='iframe_d_header_fun'>"
            
    if (list.maxmin) {
        iframe_d_html +=
                    "<img id='iframe_d_header_fun_maxmin' onclick='javascript:iframe_d_header_fun_maxmin()' class='iframe_d_header_fun_img' src='../../iframe_d/img/max.png'/>"
    }

    iframe_d_html +=
                    "<img id='iframe_d_header_fun_close' onclick='javascript:iframe_d_close()' class='iframe_d_header_fun_img' src='../../iframe_d/img/close.png'/>" +
                "</div>" +
            "</div>" +
            "<div class='iframe_d_main'>" +

            "</div>" +
        "</div>";
    $(".iframe_d").append(iframe_d_html)
    let content = $(list.content)
    let main = $(".iframe_d_main")
    main.append(content)
    main.css("height",list.area.y + "px")
    let main_content = $(".iframe_d_main > div")
    main_content.css("display","flex");

    $(".iframe_d_mask").css("z-index", iframe_d_list.z_index);
    $(".iframe_d_form").css({ "z-index": iframe_d_list.z_index + 1, "width": iframe_d_list.area.x+"px", "height": iframe_d_list.area.y+"px" })
    $(".iframe_d_iframe").css("height", (iframe_d_list.area.y - iframe_d_list.area.y*0.1)+"px")
}

function iframe_d_header_fun_maxmin() {
    if (!iframe_d_header_fun_maxmin_is) {
        $(".iframe_d_form").css({ "width": "100%", "height": "auto" })
        $("#iframe_d_header_fun_maxmin").attr("src", "iframe_d/img/min.png")
        iframe_d_header_fun_maxmin_is = true
    } else {
        $(".iframe_d_form").css({ "width": iframe_d_list.area.x + "px", "height": iframe_d_list.area.y + "px" })
        $("#iframe_d_header_fun_maxmin").attr("src", "iframe_d/img/max.png")
        iframe_d_header_fun_maxmin_is = false
    }
}

function iframe_d_mask() {
    if (iframe_d_list.shadeClose) {
        iframe_d_close();
    }
}

function iframe_d_close() {
    iframe_d_list = [];
    iframe_d_header_fun_maxmin_is = false;
    $(".iframe_d").css("display", "none")
    $(".iframe_d_mask").css("display", "none")
}