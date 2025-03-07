    /* Sidebar */

    // init Drawer
    wieldy.init();

    var current_path = window.location.href.split('/').pop();
    if (current_path == '') {
        current_path = 'index.php';
    }

    var $current_menu = $('a[href="' + current_path + '"]');
    $current_menu.addClass('active').parents('.nav-item').find('> .nav-link').addClass('active');

    if ($current_menu.length > 0) {
        $('.dt-side-nav__item').removeClass('open');

        if ($current_menu.parents().hasClass('dt-side-nav__item')) {
            $current_menu.parents('.dt-side-nav__item').addClass('open selected');
        } else {
            $current_menu.parent().addClass('active').parents('.dt-side-nav__item').addClass('open selected');
        }
    }

    handleSidbarMenu();
    $(window).resize(function () {
        handleSidbarMenu();
    });

    $('.dt-brand__tool').on('click', function () {
        if (wieldy.sidebar.drawerRef.hasClass('dt-drawer')) {
            wieldy.sidebar.toggle();
        }

        $(this).toggleClass('active');
    });



    /* toggle-button */
    var $toggleBtn = $('.toggle-button');
    if ($toggleBtn.length > 0) {
        $toggleBtn.on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();

            $(this).toggleClass('active');
        });
    }

    /* /Sidebar */
