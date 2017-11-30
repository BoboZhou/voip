'use strict';
(function (RongIM, dependencies, components) {

var contact = components.contact;
var pin = components.pin;

RongIM.routes = {
    linkActiveClass: 'rong-selected',
    maps: [
        {
            path: '/login/:selected?',
            name: 'login',
            component: components.getLogin,
            meta: {
                pulicAccess: true
            }
        },
        {
            path: '/signup',
            name: 'signup',
            component: components.getSignup,
            meta: {
                pulicAccess: true
            }
        },
        {
            path: '/forget-password',
            name: 'forgetPassword',
            component: components.forgetPassword,
            meta: {
                pulicAccess: true
            }
        },
        {
            path: '/conversation/:conversationType([1-4]{1})?/:targetId?',
            name: 'conversation',
            components: {
                list: components.getConversationList,
                main: components.getConversation
            }
        },
        {
            path: '/contact',
            name: 'contact',
            components: {
                list: contact.getList
            }
        },
        {
            path: '/contact/group',
            name: 'group',
            components: {
                list: contact.getList,
                main: contact.getGroup
            }
        },
        {
            path: '/contact/star',
            name: 'star',
            components: {
                list: contact.getList,
                main: contact.getStar
            }
        },
        {
            path: '/contact/org/:deptId?',
            name: 'organization',
            components: {
                list: contact.getList,
                main: contact.getOrg
            }
        },
        {
            path: '/contact/friends',
            name: 'friend',
            components: {
                list: contact.getList,
                main: contact.getFriends
            }
        },
        {
            path: '/contact/request-friend',
            name: 'request',
            components: {
                list: contact.getList,
                main: contact.getRequestFriend
            }
        },
        {
            path: '/pin',
            name: 'pin-nav',
            components: {
                list: pin.getNav
            }
        },
        {
            path: '/pin/received',
            name: 'pin-received',
            components: {
                list: pin.getNav,
                main: pin.getReceived
            }
        },
        {
            path: '/pin/sent',
            name: 'pin-sent',
            components: {
                list: pin.getNav,
                main: pin.getSent
            }
        },
        {
            path: '*',
            redirect:'/conversation'
        }
    ]
};

})(RongIM, null, RongIM.components);
