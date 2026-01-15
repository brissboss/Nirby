import { PrismaClient, PoiVisibility, CollaboratorRole } from "@prisma/client";
import { hashPassword } from "../src/auth/hash";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create 3 users
  const user1 = await prisma.user.create({
    data: {
      email: "theobrissiaud@icloud.com",
      passwordHash: await hashPassword("password123"),
      name: "Théo",
      emailVerified: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "alice@test.com",
      passwordHash: await hashPassword("password123"),
      name: "Alice",
      emailVerified: true,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: "bob@test.com",
      passwordHash: await hashPassword("password123"),
      name: "Bob",
      emailVerified: false,
    },
  });

  // Create POIs
  const poi1 = await prisma.poi.create({
    data: {
      name: "Fraktion",
      description: "Startup - Fintech - Paris",
      latitude: 48.87324153744834,
      longitude: 2.3412600502008014,
      address: "16 rue de la Grange Batelière, 75009, Paris, France",
      category: "landmark",
      visibility: PoiVisibility.PRIVATE,
      createdBy: user1.id,
    },
  });

  // Create google places POIs
  const googlePlace1 = await prisma.googlePlaceCache.create({
    data: {
      placeId: "ChIJxYJUC2lv5kcRlhdpWba_aGU", // Tour Eiffel
      name: "Le Tout-Paris",
      nameLang: "fr",
      address: "8 Quai du Louvre, 75001 Paris, France",
      latitude: 48.8587493,
      longitude: 2.3422529,
      category: "french_restaurant",
      categoryDisplayName: "French Restaurant",
      categoryDisplayNameLang: "en-US",
      rating: 4.6,
      userRatingCount: 1960,
      openingHours: {
        openNow: true,
        periods: [
          {
            open: {
              day: 0,
              hour: 7,
              minute: 0,
            },
            close: {
              day: 1,
              hour: 1,
              minute: 0,
            },
          },
          {
            open: {
              day: 1,
              hour: 7,
              minute: 0,
            },
            close: {
              day: 2,
              hour: 1,
              minute: 0,
            },
          },
          {
            open: {
              day: 2,
              hour: 7,
              minute: 0,
            },
            close: {
              day: 3,
              hour: 1,
              minute: 0,
            },
          },
          {
            open: {
              day: 3,
              hour: 7,
              minute: 0,
            },
            close: {
              day: 4,
              hour: 1,
              minute: 0,
            },
          },
          {
            open: {
              day: 4,
              hour: 7,
              minute: 0,
            },
            close: {
              day: 5,
              hour: 1,
              minute: 0,
            },
          },
          {
            open: {
              day: 5,
              hour: 7,
              minute: 0,
            },
            close: {
              day: 6,
              hour: 1,
              minute: 0,
            },
          },
          {
            open: {
              day: 6,
              hour: 7,
              minute: 0,
            },
            close: {
              day: 0,
              hour: 1,
              minute: 0,
            },
          },
        ],
        nextCloseTime: "2026-01-16T00:00:00Z",
        weekdayDescriptions: [
          "Monday: 7:00 AM – 1:00 AM",
          "Tuesday: 7:00 AM – 1:00 AM",
          "Wednesday: 7:00 AM – 1:00 AM",
          "Thursday: 7:00 AM – 1:00 AM",
          "Friday: 7:00 AM – 1:00 AM",
          "Saturday: 7:00 AM – 1:00 AM",
          "Sunday: 7:00 AM – 1:00 AM",
        ],
      },
      photoReferences: [
        "places/ChIJxYJUC2lv5kcRlhdpWba_aGU/photos/AcnlKN2LPK5WqXz7EOANDm8PU6uv3VVn2sRjjnt1C85ubPGprM67MEZ12HkRgD_rt2ofWYUOrMZO74tWPoGEHyFtBr4WLoP-MZp-LVBJVkPZ1tPNqY7be3c9oPYBF08mc1UQbUNMAC_pTwdghdNA6fW9uMmDsmZpNWrzg1gzLq4Z7DpimKbYv3vnv_UhNECWKph7D-kvgS82J3VY2hp2RBWggRjPeAGpXYLloMnx1BIXHI3dE-2EJLEIc6C2otWHwF-L7wmZ3P2ZBcAmTZDJ7oFoYqwbwzoYvDl91zrPIHUUpdL_ew",
        "places/ChIJxYJUC2lv5kcRlhdpWba_aGU/photos/AcnlKN0k4duGU9uT0p7jCPVYfnR-taUY1RV5FNTclLENUvh606NcfbACOYQ2iUKjM5q650sV9QReuUAK4xX2Xb1Y_jTjZrGSyMTFcIPoMt_7aFblJ8USfwm1eB31AcM0UJDhJ_1cdd-mxwJud4Ttmn-7dFQ7KXgNbL1UhM5vJgOyUFg4zHMqmw4ih9Hty0-9Qb0j6nUxy2QYYA7xCwqKdIKqMJ1s1mR-RMxzAh1G9ATPDMMzohiUUArs04A57il6G4Enn8u75prnO8-fngk1Q6Tk6MxR_Ak6m3RIHGY3Vu9achioMg",
        "places/ChIJxYJUC2lv5kcRlhdpWba_aGU/photos/AcnlKN0MCZTL6WmyzY1jyv9lo78WXn0Y8QEUfgjpxElyi54CYXAQl2zXMRrzxx9-TbaBA-kyNGsCb2FTAOHTGH1AIXgQf6DnomvK819ALvNeOL2ju3f5PtapXxKDB7GKYcyN2gWZzUO_oVEr0Jn58OSB3rM1CPUD736ZmPxMNMTFN3eYr9-RhSmdIzaIh1ZGxdYCjDF4v_3MNXeWt6n6xpJ5_Hs6ocHtoGy8keRuCmO5x4zwTGVMABS5Vn6SdSt1KATUQzOFXdRZ0TL-5bnb0zfKpuNGuIhimBdDjaLsejyNhTzyijZAlRFT4x8kfSropWnw9kTrwp33PtrrF3zVcJ9q_csUUyPUk_c_HmRKKjsQvaLmBQ5AUCtOXkBLnBQM7AS2YRcUaSYjqJxs4YDxE59925dj619QWou3YGW_Cv8DjT7bMkLAtgIRePPWmNBHnejq",
        "places/ChIJxYJUC2lv5kcRlhdpWba_aGU/photos/AcnlKN3WO8NwUd9kKXbksLtFpvMvDK4z63ALmsDRbfVSo1-Ie_1v3MNrGNqUZ72sSCgyCmhLONLYjDfsHrauvNFEGCJ7HG7Ee8TSNT27E72A3EXpQF3j0Ox_scEz6BaQ4F-48SYs9k5N_ZkN5WukIYMdz4nkz7EjkFzPR4bCOrVJG4nV1yrRJAuBHfX8JDfDaLr_bpnyPzxHWHHghUaL9NDgApiiDRvMyW79r8qZERs_0kEnPg0Ps0vGZkZ-YpYrcOayq8hGa1XlYzCGWODSgdSwZCLfKLmNJ5DrDsmng_hLpeaM_bGkwz9-fLiRDCQ_xP05Gt3xqVjz_c5iOkucG0dp-J_ffl_2xPZzMQDkFPCbiv1RmsQU9xEFvt91-Nw83yR6mV4KZmxGe2Dg-hbPJpccBlrFxuq8C2UI1dOZFOvv0r3BNQ",
        "places/ChIJxYJUC2lv5kcRlhdpWba_aGU/photos/AcnlKN1c9F6GTPvjaF1J7RGNRbkdAdJiaP0Aoxs0prVEC0UCWmqIVChOwHcGRbnXdFATlXDfwQaiG9SRNvIF4azPI1nmRtsK90WFdFvZi97UfXJmcOqPn0wDd-Rc03zUDqxspNbsn1RJeO8TQ7BgyF9IsmOH6TiPXrrzAA8NworxgR79tsDmAGcpRWTgkJ6waRTUZi5sVdVIgXa7SVRdLnkP0u2H2AP5PreF_Qco4s5ug-WNoNv1GLVGM6R2oM96Ah1PdCPHoWzvhyjce0AmpanN1I0NQXBP99G488OoAEQC689vwJClmIScjKUS9trg9YDG3gqiglde9sbuFrRp0C51gg4wWx_AWZP8y2I_LPrbBBQONx8ZpC9vO6E4LCsDiR1RU0_MlfUM1R0e-cL9HzPESUaCU6NGCkHt8mt1dohy36F82lQpi2_vRTRpyIHjaA",
        "places/ChIJxYJUC2lv5kcRlhdpWba_aGU/photos/AcnlKN0aC26CmG-J68Vei63nQQy78K36JR2uKTPl3hUV6gSNh19SvlQ52exH06ocSCLAOCZ_T2-rHaLsM154PdGezHBKJ20rS9CMR6fuvkb559lCmC44FEVewryFg9DgY66eElvJfbe6mxeCaYA2DZ73WpYDfZ4g205HDvIyV3Uw_Y_KQtDKL5rAwLRyGuuQGYhGbVhuuy1q9kRfc3qjXXQ3rzxC_41EoP5pFmAk8LbGSCZhr4DCNLbm9DZvfkOhJ9uZqdnz6JQWQwSmoAds1tjv-JmKoX7g-KaPnlW-Q0FEZs4_DwV_cXp2zo4PK6A3EmoJsbeQD2Y6KBDJHNtFXowbTQ_edkVD38_oZcFKJb03QOblC2Lm6Jmo5uf1De3Ze_P6LCaafA1rNVh66j9yzogLal1pWgz7bDKLDf8UPzUzvZj8U3EeDQQeLUgxhTJfjQ",
        "places/ChIJxYJUC2lv5kcRlhdpWba_aGU/photos/AcnlKN1CjswHz3-r88poqAynWDMZpzSFVcW_OckwbQgOjSFmj-ONh6AyI_YLnK91cm3zwohvCSSTZts8w4M1jJ0cxLe7ehWPREEhTCBnUtrLOpnOicc296-zfYJNnoCOWc73iMEmEw16jlS417Fz2r2y422FLpcAIDhxEk7FFndY7e0E3_Rw28UIcSoo8Dnss-BN0TCR5bhNbc0ieMuvWawAmt-iNimA38j7-G-tCFX0wCVpSG2gkZtXmatUhg4Eksio2pgyJXVpkbyPW3KPeQU9KvhLZ_luOrBSVz-wz2iXqpvHBw",
        "places/ChIJxYJUC2lv5kcRlhdpWba_aGU/photos/AcnlKN0wTWLZQwYkS8bgNm1dNIzAdYwS6ss4txdfeDqJ-_Bx90ATIDj9lkBBBjEurtX7ruJYwpCtmoKcLFWUsxp69CAfkjYSBbYVrKg73SmDE2g7HdF91qUyXut002B0mY0Wv7DPWwIRqKgp8Tz7VmbjrbN7tASubxbQ9JknDgwNDcXbDk8V31nUTmRtwWLabOUTix2amDr0bWbea9bd9XiIk7Q2GtElE2xr-2JNFwjpqq09ElgeeREqQ1c-eq2QhVDGVjbzhoTQrqr6L53rYxCkjIPdoDvJeUkpK9TapNT0YjSOuIwIUhSXtpPPHEiHeYoqyJ2s8bHWTB1LtT1ov_GhD7O0D-SAdjKF7GAXpZPkorupsY2AVDMuyqWXrMLTNVj59oQzy-OlDkoG9KPnrrc3mlSQ2qhnV0zMA3coLwWXrM2xM6IfRyUtpnVgQqUuQfeU",
        "places/ChIJxYJUC2lv5kcRlhdpWba_aGU/photos/AcnlKN1TR0rDyW2LOG2rnj8UXa5Y-8Fu4f2-YKTd_Yr7QBw0hEyaLBybJ6EQkWjNIsB0LJfm_Ad5xb2-PLp-4-hNXYO5AHG_ORJYLmFzv9VJW0u9MKlhkuUCR36j9HxMeuF-MJc0-uJc4qKZ8_BcFU-gbmR2z_9ZVsI5Yt5ukRZoDv5KSIDz8V8lpxDF8B5al-LSKNpe2tLD7TcHg9J1MhhVr_z52cqL5uzYWyRPSmW2-uNEtwoREudotcqv0z0N32jLjDoLQQuJCLxk4D457uCPjZkDnnb1I9UqSHuGMtngrGA0OKB5CP1B9P7D6s9wqOXzVENRQlPWwgYxUYZNnrQKq9n93HtjeRpN70e99ToRVlfYw115gId_TweGZKjY9AI3rTgOq2HiIZIkhDNWc0le9u-UdImEyoe7VeEu0SvlznJyxTkKKgGk9ZyyeTj0kEP6",
        "places/ChIJxYJUC2lv5kcRlhdpWba_aGU/photos/AcnlKN0LUE9nV87XORxhLbn2jTXGMjXn6AvbMABx_EMs8LyJYObOkRKcHd_564OkcaCIXvdtX6xbmw3A5d_kGhxxJengNp-sjCQLoQOWf2Eqyz3STlLyTNnNBqd2MLBe-PtsnDgMA3bPJxCatiuUFlbe0EF0uI3oGyEL1EdK7Qh6kB4JYaqIa1jFjIwrmSIBcBJ2zE9bQazcrsGB8z9E6g3tzQjRyDW-4ZtJhylkyIaJkMOL8CHCsCy387Rr5WdgdOxYC7vxb1ZqBO967mV8Mn_5ErxcID9rPgmlNhVyVnbrVGrtHiqg2n_8O4ve8DpCp3L_lcja8ST8YtlPd2o84ItklMPQKeHrAGT7oeNC5wAARBzof4BCsyhJ9bS8EZxbp6L2XdUMaThwp2s-SqKuqsmv_MKscfmCUGiib2O-CZZSXatBxj473M52u8CiN-hrrw",
      ],
      googleMapsUri:
        "https://maps.google.com/?cid=7307301185313642390&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAIYBCAA",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const googlePlace2 = await prisma.googlePlaceCache.create({
    data: {
      placeId: "ChIJf-oe7Wdu5kcRRto099RQ9Fc",
      name: "Sacrée Fleur Montmartre",
      nameLang: "fr",
      address: "50 Rue de Clignancourt, 75018 Paris, France",
      latitude: 48.8876187,
      longitude: 2.3479882,
      category: "french_restaurant",
      categoryDisplayName: "French Restaurant",
      categoryDisplayNameLang: "en-US",
      rating: 4.5,
      userRatingCount: 1200,
      openingHours: {
        openNow: false,
        periods: [
          {
            open: {
              day: 1,
              hour: 18,
              minute: 0,
            },
            close: {
              day: 1,
              hour: 22,
              minute: 0,
            },
          },
          {
            open: {
              day: 2,
              hour: 18,
              minute: 0,
            },
            close: {
              day: 2,
              hour: 22,
              minute: 0,
            },
          },
          {
            open: {
              day: 3,
              hour: 18,
              minute: 0,
            },
            close: {
              day: 3,
              hour: 22,
              minute: 0,
            },
          },
          {
            open: {
              day: 4,
              hour: 18,
              minute: 0,
            },
            close: {
              day: 4,
              hour: 22,
              minute: 0,
            },
          },
          {
            open: {
              day: 5,
              hour: 18,
              minute: 0,
            },
            close: {
              day: 5,
              hour: 22,
              minute: 0,
            },
          },
          {
            open: {
              day: 6,
              hour: 18,
              minute: 0,
            },
            close: {
              day: 6,
              hour: 22,
              minute: 0,
            },
          },
        ],
        nextOpenTime: "2026-01-15T17:00:00Z",
        weekdayDescriptions: [
          "Monday: 6:00 – 10:00 PM",
          "Tuesday: 6:00 – 10:00 PM",
          "Wednesday: 6:00 – 10:00 PM",
          "Thursday: 6:00 – 10:00 PM",
          "Friday: 6:00 – 10:00 PM",
          "Saturday: 6:00 – 10:00 PM",
          "Sunday: Closed",
        ],
      },
      photoReferences: [
        "places/ChIJf-oe7Wdu5kcRRto099RQ9Fc/photos/AcnlKN24yZUb2ZL3b3St6QrqtGdRK49fl2-tq8UNusb33u09zhm4fUYbtyV01BI9sfVWbETGCvONL4LcuNALRcSiJfGg94zHP-nzWn5uKtg8mIfyIcrm-MlY3TiSPr19Jjx5GCEeqyHHr7C66mk3ZHu_e9b1cRglYDvO1-zK4z737LXh9_ySpnA8RBF8i5aewdnafHc-PL0sNW1oufQByPGnEKy-Bw-0DSxUR20zrG4WCIWCqsXchqFoE-YN6r-GuXJaZhsPiaJWQ_voQrCOUXDeAqv5LGdWmvakeRkzXu-LLcnlMA",
        "places/ChIJf-oe7Wdu5kcRRto099RQ9Fc/photos/AcnlKN0uCt_a45N_xM3EQaPCU5glEFH3SJtpPMbCPdNQP8z6kxqkKpbS0mjxZeccC9EwcRi7puELlha0_9Gif5stDEicjYxyr7CyV96vQSk7JBLj92ADnnkKnSVHEiHGf2d6ZfAO2w-9Xca_yQRiDJYG1lNdKhSFtdvS-1RdANEpBg3LcUIAgPRqE-AavfHmLeN3oWOEBR3pdjbbYkGZQQyWMfeqSwsffRDpzavkm-tuc-jHbgpXofnlZMKAxcVsaMZJozz4cqdrpynyyQI9JkKf4CXUWpAYVChfEvIJnqhifhuXKA",
        "places/ChIJf-oe7Wdu5kcRRto099RQ9Fc/photos/AcnlKN23v1mWn8doF4RoJ56DYUoaYihMBiZjFCjuCR_4AHsU4d3jyRwEEX7d7G5nbfxVek_61V-0b6OzUqeieiy3rtaiwQaknOQnmedU_Qr8cgUOciuX-ZPXM-D0hBdIScRMXbfSFp3eGddzabJwmSEf4vFGdx1W2US0RWoXn0DZ7aPHeC7x6FrPeIi6Meiy1Q21e9kysIs8E15WrvnGzDxHiU0BMcRdI42FHAMg7uY2a5589wNoe-WSeXc52Jyje0RijFUNqT1A-lByot7wAKgoHdJ9fDZ9l9DnYmL-MBO_wmeaJ87x6F0LPuzJshBySFJ-VQPaKtLigxtYC1du2-ubQHa0CIpO_P7VtnB4K_39wfs7BleV0fS3LeJGynvfNDokxl2EGkkDcxazPYjAze-qpDuZOiNFs5-5LrRjks35vQiMNziiS_DUcpUSFrHUrKBm",
        "places/ChIJf-oe7Wdu5kcRRto099RQ9Fc/photos/AcnlKN1ybQDQmsTHTw8UfMibM_wZVtXUM54DZslZiVkL3SxISfvAnoJ0B3qijmrh7pROEzFuvF7Rm-Q4GcrETsg8W-ozL9UrwC2iqyw5DRVLxHZEnCgknQ7u0UDXOgCKIRqYnyZWOIkFGP-cRMcungLLbnzLPGV_rG9aXSn2GxHHS0NmKY8HNRbM-XZTX0yAV_bfUJJJucrVv9nLdsnGh2rq3u_lA4J-ech1Mu1-Jgt2FlIc-hvucyiyIAjgGoZCrICgIlU-ONzU4MSeD6-uCXa_KkZ9o-eTVvIyT5Q611CG__pesVoufBia060Z-v875TB8I4Cz-ruKMnYVEuPR1V8BPHIzv9fhTucztVgzHhrpQKKr_T4uXRsKKBc2huqnxDIIQA5uml0T5hnftldR0FVsJ94WSbsJlEMFRHbw8oHRTy9NyVnGkIvSmlXCN3fIX89x",
        "places/ChIJf-oe7Wdu5kcRRto099RQ9Fc/photos/AcnlKN1F8GwdWSgR_br79ec3bhcShGk0GjbOn6UFfQZNNK_nLD7-AyszTEatAg3_k_L8OdAE2B0WOGng3lNHh3gVeBuyKpu_F_aXwtCkD7cTdF4soT8_B8RYzwFb_DLJTZUlz8ynfNsWc6cucjsouDoZPT1IT38o7mR31yB1pR3RUWiR0ASvKi9SGa0qV2syOxIxf9Z5CrIXNPy_DoJq1kawmxQhF4SGFeSCcZRcQcvPjvgjpMbLePiF6uHwNGXNhrU5lIekr6nmRxvUjRq6aGbaGVDaR7Eh7LMGERlEEWhh1lz_4zAFcFBFR5O3wBhlgmfmlgZCxt5QBrjOM2l0_uuzdrTUnWUo6s1SyWDlWSC1zGkSfdSWBCNhH4aUL4xTcAClsqcxRZt6NyQS6XHsYtFzHsOPnelIf-V81vHdUpbo2Rq58Qm1",
        "places/ChIJf-oe7Wdu5kcRRto099RQ9Fc/photos/AcnlKN3msZHNX2QpogSTnUflJ-ObpXIbcAMA3_bEQF8Gnvs7SfZfYk45rnWiz0yytNh3XigYgOQ8TkIBeAWOwiGmPMJea09Gj4-M_4hlQeIOpLQxOajGDXQcV8TjQHP7CsTFK2wuzfEG2rt64voPsll5EalbJP_oYx2aTDc7ToALRPA3qYXN0V-yJO7HSHYVbWZjdC0co4gE2SJYjcuT2oD_Zb61xm1X2LYK8Cf1a6fuNYOWUuzvccdeqrkxZe_Mm3K6mFsObKqqRfod14QlMgwJey9URPbWFMHyP_0TlRLjsYcP7I_wGPmKqQUkO52DJEosnfSARdMPgiMbqOEd_Ov4RdXxWXh76-NfSIXQ9dSNCZ2IDp5X8NKx3srerKOCxJHZnNvSfgEoddKwrvltmOvo9cZbEAQtw2fvf5PIRyoUfIJGhHCedFz1yJWpZcOJqis2",
        "places/ChIJf-oe7Wdu5kcRRto099RQ9Fc/photos/AcnlKN1JMRHqb13bsTpzci6b_aysiU022nNx9xYtSOtcfs_DoXvN6xW09StUWj3Km6ApCWLKbcB6KPdHFgWqNHzRRe1NST1JChTFR2wcvJSWc7uZQWCt4JCfK-77jxSVRNVLE7Om6rSL5e7oRT1ai5fOE-zc-8I01bYfsKR6Xzi0_9Q48un-2wZJp9QioytRj4ILdf5C_KT14_K4JpkofS4KgO-XCoTiuT8IQIrdBMYsQjaeAR_IqZ7X1xW2H_-qSw5ZLPBRPlgKjYyNaS_4JKrSieR5zbBLL-4_YjMjiQDbmEg6bzAs0y4kzowUI4Zir37J6s0XRXSnAhtZasnoz41UL65CJoqOOnTPkkZpdnDIqiKA9yFLr_CDF4zX95S1S3kcgdOPkL8uAa4Im9X8uZoiZuhaL3vnw9lGVRk1y-CgJLOkFQ",
        "places/ChIJf-oe7Wdu5kcRRto099RQ9Fc/photos/AcnlKN1k25TlwmTh10z2SnrL_n8FXdLfY42SVT83jqCMEGf2UkpURqcZrj3kAacC4SjgdlgLAmHN_IIEFNGywdGCn_uuu5NHbLOD_krbW0BwMQFg-S-UWjqlcSLMMKRAZB6hAE9FqK-cxhdBAv3cl2-Y37SMALuAy9TELlvwF3oo-ZsRDynV4NuyHIBSdFlwqahpNr0V67e6nGZn9qsRrnFlEpuzMlpHYSOKArpHWLyS5-yBoOaQjYOUgArCO_ZkZNrO3_dt2NgP6CTpg6957RI3FHdyCQdD8jpJ0_w79w8JQfgSuOmNjWPhWK5NjyJFdfZ4M1WklWSND5rrJyu6OhXU47ZjrrWD1nehKC0Firqx_PJoQ4JtnVCKEu1yt7Q6dWiIldW6lvhuRt_kcYYzbyonUe0dO61DfCsrt-XUfUoKQOnF9Zo",
        "places/ChIJf-oe7Wdu5kcRRto099RQ9Fc/photos/AcnlKN0RojQcO8AmgO8RSPp8mrk2aM6RvlIWPmmQoZ9Y39iHeF0wIjh-XSamzhh7CMaKcf1GZcf8j0rRLExHRd1HoAFksjpVmBcvAH7PZkvw6u50hShFNQUqdVS7jn6FuG3gblOQlzcLJKbR1UD_k78HS5jHeHb1eYTB7dsw8bS_8Sa6-a8FUouTdkdC2iETHHXNxc72uapXHY1O0oBbY5hMGXz5s1BQG6p4tdegK0wlq0UvVlr50ivB7NDQtH_Ad_fmN2EOSx7gsplcYJjsbaBMq_myqv7uXIpjax1VUAJti25m4A",
        "places/ChIJf-oe7Wdu5kcRRto099RQ9Fc/photos/AcnlKN2-lusA1ASUfBBJNLCejh62UcIkkASMT9lupSCdZmSmbP3rpNloOeCL6nsKVi54feCPSAfDG7S32gG01c-VxnKbqCPGjd4s2B8cJ00ShcJ8CcC2oz7LeEMaAYoYRhurqlnH7luTpV5SDUkovo7vY3hMgWDPMEfzUS_yrxpKtLO9KL0YgBo8-7DpcZQjgNTUCGagTuZzOCwcH3WC7GE-_mrtVrNS2bxONSKtt_qdb3bEAa7zpJAxhn6S11qfcXHvXdUU0IuLy5jXlZVp9urG_33mvl0RQuMRWJDGpJD7hdVeNEQboqPBd5U8Q1ejbdWBOL0FN77Aj2sIxKx_5GgOrA1vdIZBW1Pvbz3S7y2nq5Dt_BahOjTKuJ12NoVbq51f0UkB02L8V7Uv7fU7ctWRrBNqUmzlEVJNbUDoGJSzadCi1rcgU4gX-ZZK9VNtY5f5",
      ],
      googleMapsUri:
        "https://maps.google.com/?cid=11554511042646742106&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAIYBCAA",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const googlePlace3 = await prisma.googlePlaceCache.create({
    data: {
      placeId: "ChIJ0Y7Uk_lv5kcRxQMuMKFtVmc",
      name: "Le Marais Restaurant Paris",
      nameLang: "fr",
      description:
        "Prime steaks, burgers, salads & desserts, plus beer & wine, in an easygoing venue with a courtyard.",
      descriptionLang: "en",
      address: "47 R. de Turbigo, 75003 Paris, France",
      latitude: 48.86513799999999,
      longitude: 2.3540023,
      category: "mediterranean_restaurant",
      categoryDisplayName: "Mediterranean Restaurant",
      categoryDisplayNameLang: "en-US",
      website: "https://www.privateaser.com/lieu/44897-le-marais-restaurant",
      phone: "+33 9 87 36 09 13",
      priceLevel: 2,
      openingHours: {
        openNow: true,
        periods: [
          {
            open: { day: 0, hour: 9, minute: 0 },
            close: { day: 1, hour: 0, minute: 0 },
          },
          {
            open: { day: 1, hour: 9, minute: 0 },
            close: { day: 2, hour: 0, minute: 0 },
          },
          {
            open: { day: 2, hour: 9, minute: 0 },
            close: { day: 3, hour: 0, minute: 0 },
          },
          {
            open: { day: 3, hour: 9, minute: 0 },
            close: { day: 4, hour: 0, minute: 0 },
          },
          {
            open: { day: 4, hour: 9, minute: 0 },
            close: { day: 5, hour: 0, minute: 0 },
          },
          {
            open: { day: 5, hour: 9, minute: 0 },
            close: { day: 6, hour: 0, minute: 0 },
          },
          {
            open: { day: 6, hour: 9, minute: 0 },
            close: { day: 0, hour: 0, minute: 0 },
          },
        ],
        nextCloseTime: "2026-01-15T23:00:00Z",
        weekdayDescriptions: [
          "Monday: 9:00 AM – 12:00 AM",
          "Tuesday: 9:00 AM – 12:00 AM",
          "Wednesday: 9:00 AM – 12:00 AM",
          "Thursday: 9:00 AM – 12:00 AM",
          "Friday: 9:00 AM – 12:00 AM",
          "Saturday: 9:00 AM – 1:00 AM",
          "Sunday: 9:00 AM – 12:00 AM",
        ],
      },
      rating: 4.6,
      userRatingCount: 890,
      photoReferences: [
        "places/ChIJ0Y7Uk_lv5kcRxQMuMKFtVmc/photos/AcnlKN2hObi2Rd1GcAxI4ExSxQ3k7oeMTIxyA5vOrARj-ofp8I5cU8yL63NhxvtZk6crTDTZF-i-PAPh7ISOnOatsMguYSdP5ik1WkVRRHY2zDYeFiAfQqZD0AcpSg0ZT2oX4VycHhBOG9w8fVYH7NRx6GYSAuiecQM2BTrkGaaVrLOsiQRXH_Rs18VHoESFu1ufyre1NA5nsNZCN7R5sfZbGlZuYCstbnckBrJyeccQPzfDNGIDnle4FA05gp0Y2L8P3WX4d-lOmOLUqMHe3NvxJYahg6pM29RwOlOFowdaMwwTOA",
        "places/ChIJ0Y7Uk_lv5kcRxQMuMKFtVmc/photos/AcnlKN0bBHWOqLk6jICPQpPzT13-emKipJH9igMJgPN3G0hgG-wdqqhgFkQNopGko1vt68qFw1c7B8kTuyRVNmK1HsD3W9PTCjREesrkZUSEKrAymRD0slvAZpKOdBMkz4lSBSWnO-ElArnfi0unzoy3SZPGpMrY4rVNubIyiyeStH2-9eYzSs5ga5uaeHgQELjT6uM9HVw2G8qGn78KfPcRvZmjRb5IHJZnZux7mBGcXUsjDMuHiU9T-hs1HX0MmJl9AoQLkyuVDy-10sCVmR3IRssSe8IZ-BIHHVcSo2BU_dg2gw",
        "places/ChIJ0Y7Uk_lv5kcRxQMuMKFtVmc/photos/AcnlKN1AlD4R11GY8vZ-ZSHNrIxPa_WJ1I0KeP70AyJctJR9EAegQMSaITaMXbAMuAGZgp1761V0p0CVHzgzVuuc-4czLKHsUp4DRMn0ZozNLOUVKb8GHzR-oaNeEcH_szIEk0lCiMbwhvDaeclLX62Z2fgq8g-AMNqsu2ceEYiYl3IOpIt7c9mZyyA7q58yzjA3uZey5cSh7r-QzqVJN8qzpKLOGCnw96MkUL-qQz1_O2gUBso0UX2oxEYN1m1H07Mga-On5ewGPxb1W1JAFvIjA4JvVyDY8aKyzFB6NGIdHWojSbpj6_Ui0bBCnV99O_qePb3s4kBlrvgO4gRGDqNaFsSxooJiFan68DtS6kEgYw8fKGo6gLCKMobBmr0lSUv0B-BA4PrCPI2ol58WVH7vef3BrddV-FC1YrnguxMXaiunO3wm3dvyBmuu2KBz1m1H",
        "places/ChIJ0Y7Uk_lv5kcRxQMuMKFtVmc/photos/AcnlKN1lOxrYXNkYpFExC0s7ZloQPfid73FPMpLCd2WzNcZ8_ph-W7RX7PlAO9p2atyoNBHWimtm3lgMLoygrjNRArVmlC8ThEUE1C6-zyrUFYUm6klG0Q7TvCjSlcgC0OUczJgq_t7C0BR5-Yr-VA0us9sTMOSTrtEFzDiQP0-ikBScvFFIUA4PPoCJipEhjWFzj3qbzZ6w6S68GLHUrh3Si0bKgHDoSvvEuze16t87XRDdpzUDg4k4xH6FQjbe1yUfXIa7-8Inzm8QT-nFH2L65S3aZiB3_gLRPvYTMaeZWfb9IlRaVsTRaQMghYGhWoM49ZW2yil01N7gfgVEcghknvzes-HQlT72SOIfF6tZetm-sjhaPYWKIoF7-Bv2KVmbwRqbSRPe0I4UQ8s74iIAFTsc8q749FH0-jCWgMjnv1Xa_QWtsEmLtWizszHtKlbG",
        "places/ChIJ0Y7Uk_lv5kcRxQMuMKFtVmc/photos/AcnlKN08cV-DXMaVzuQK4c8P8VSrDOrkGVa-_SvNhGOukiazgjpAi6UrP2XvOzH7Un-gaf6K3c__sqDfF8kKOy1hheC314kEjM3k0nKuVPfxTfRaLu3CEf7ONxB6blGxJreqoDMkFtAParSvIqN2_KEKHZpNfvHtbji59iIy6zeKsEfUn5-tnHOXfF85t5m4g23_jFTNtR9VVv5vr5cTT9Nh7zAcj6L8VvlvCJGXx6lD5SGZuxy5cqsjulyack8m_Bn-LN0R9w0k72v-M2tDCeTEZ6kzwgaanCUto96vDpsuMVI32555_W0SB-Ywemzq1LrbKjFCUTA7jn4B7cMUuh6QecAlZ5pl5ZjzUqViGZrglxp-qDSOvI4xh6BE-1A5LifgBPZuAzIMTZzH-gn5slUfgVvvDU4rWRs4DBfFseQSNPyrCCvTFuViX6DLjV28-Q",
        "places/ChIJ0Y7Uk_lv5kcRxQMuMKFtVmc/photos/AcnlKN18FLa-lH9FXnQ0MjFG8fnNbmNUueZPbq2X1e928fpG4D0oMzE_fpkUq_9dJyoes21XjFIvn2jMzWdBhh1ZLd-qq-kIzd2_8s5MPkeo30wY59DVPEY1fJQHQ4HcRo-Q4qOUMcSEfl7J0kTgohYZ3TrAkdQmemPC3-PUOe8YtJpGTYeWhq7RANqKQsXuIzctEHGkfqfOE4yzkjRwpTeAGheHMbLbCILLUhrhosDRktDDwyoQMzMCl7Cyx4b5njp2BRtTu50emlMSJA-brmVvYU_y7yI4Z9QR-j-exrYCrGj4oul3IXIi2XQIN1iN8QPrf4AtwO4KIHGWcO6jt93aSOcLVRLq1BgE1Fd1TSHIrYc_yPcqj2KIdF0do7qZp8hoTITPsLW2vTU0JKLWuh2tlqT2Olynxk2LaA7Tzs6Ab90Sgg",
        "places/ChIJ0Y7Uk_lv5kcRxQMuMKFtVmc/photos/AcnlKN3zVWf4eBKIyF3mOEgzdpgfx_CuVmwcoCo37lKfQlMRzJ57a3sYkorDuH-F4J2XG4mS9PNuT-k6_X2NwX4n0ORdWvsKQNsjS7hiD4iKiYD0FO2b0xINuMQEqBECtrL1eXyRrOkXyhyPK0gKyjNunuqMx3zdiLk4SUYSSdh9fRR-b0Z_vGhLRcTtTOfZK3CpDhKSuvWsMDFXGDh3Odk7OaNBCVdtoRlI6tvFBuSgEfabl_DJsNgyac7T8ocQPpP_NxoJqofWJu8ciE5PUfAS7EdcbVjery2c4lUVu04_sjvJFISw-n1mQ9Sbq3_n236O_9DiA8ddo79Y73RU6N-J4Hx4OSKLd1TfHiRco-LGad7wkhipf4hoE3k8E0rB2C60aZpK8LqOPwx0792nhdhZSmrqe3Y8eRz3FwtoNcTK3vm8fd7N",
        "places/ChIJ0Y7Uk_lv5kcRxQMuMKFtVmc/photos/AcnlKN34XSwSlk3EvDgBy06Y9jhu5a86AQ8b9RuCCQyKm9f7qCXvTaG2fwFO8HRz6Jcm1WFWiVg4qpyeMjsISHZEulrvji06NlSpAGVM9NzJx5II9a9vkmExV0el8QjLgMRyBMEOLGLDf9Pw9JaWx5X07CMxnDTbXj4GK-VaIxbz2CQ3Vw6YCxp84qVNmfjc0bHgG9rlC4rqZBQ5xuECyBagX91VR2rgN2Hek_1HIRWM2-nX1OPZjJMoPVxJEituta0Tr5wELmTUWn7D2z5xU6fPjj_bK83MXNtKMR3-JDGtEt5qK7MQXd9IHSmPxIF-AR_2ltuZuFto0sXw4Jm7SGNj214wzwwZwkOMxuZsjLIaG6LWRXt0Yl5Bc1irqJydSuGq7_GzYH4SvvD1BkBqFelg02CgDksqzhnV9nCteDcwCI_DOQ",
        "places/ChIJ0Y7Uk_lv5kcRxQMuMKFtVmc/photos/AcnlKN1UACoHsARiXIjGFnzae2p6OQy3DbzTPEnulkmV-iW3b0AAEwFuZMf0VOuwzVlvxvhWdd5UOpzDCw9ChU-rK_5gZWLSlXn9e1lz2LYj9G25aPJlre7GWzXxz9jFdo2Xk5L8B8bcB2UnrlYCXiL4N5p6A-N736yCuC1FKpQfcBcndTPZKtLTsp1c7J-MC23RxEROl4tAJO8ZPZHwd19bgWVOr6dfKGdNpkD8ndGDFRFUJjEAB24Y5b8jvH8pQldXN0gbbJkr8Q4u2lPyuvHIKkk0FMw8SxZveJmqkdPR7MsADLVdwoZRmh0z8YFCjQSMNe5RhznzwoUXIkdE59SgxkCJiJZhviQ-9u8trDFSLCcCYPbNrhHldxtDtDyq-ydJBpw9-8VBBtrvG7O5OgXUbDkq52Qi-cLf_s5DO6vj_Hg",
        "places/ChIJ0Y7Uk_lv5kcRxQMuMKFtVmc/photos/AcnlKN2PMs0I3NHJjSLbTSz7reUE5u2QjrFhk6pQNDdYVNvfRg9NoDSD9nDeTShMBIwllvxYf9XCtlb5C0sE4GuqrZY0J9xKphYhbkTnK3DpqVah-uWKbm2418SUQ4IKbGzKP9-58r4eK9EHd3610k4Yx0lbvBS_PDTTixWdQQdOtU5GdnZ7tL7HyZIdTnL1nsWfz0S-qarKLFRCTxPp3iZ-Wa_ZxzwGth6AtT6To2tuaZd0Ko19ZfSQfWgWWgv80nKB3JnvVUFJWfmM-3RBebQMiI-CIQqPgOrlw1LlJqnnrvP6TKzFTMVkGRyjzq-xmIuf7TP9MkxoIhZRRqHMTJEp823I7YtShb0pgnPHvyNIe48IGJpgQvTb7I05W-6kAgL7jHPv-XwVqkwA1ZT3bcClPeSCQX9gO4oOEPho2RxeUoQqMw",
      ],
      googleMapsUri:
        "https://maps.google.com/?cid=1575247511252127996&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAIYBCAA", // example CID, update as needed
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Create lists
  const list1 = await prisma.poiList.create({
    data: {
      name: "Mes lieux favoris à Paris",
      description: "Les endroits que j'adore",
      visibility: PoiVisibility.PRIVATE,
      createdBy: user1.id,
    },
  });

  const list2 = await prisma.poiList.create({
    data: {
      name: "Liste partagée",
      visibility: PoiVisibility.PUBLIC,
      shareToken: "demo-share-token",
      createdBy: user1.id,
    },
  });

  // Add POIs to lists
  await prisma.savedPoi.create({
    data: {
      listId: list1.id,
      poiId: poi1.id,
    },
  });

  await prisma.savedPoi.create({
    data: {
      listId: list1.id,
      googlePlaceId: googlePlace1.placeId,
    },
  });

  await prisma.savedPoi.create({
    data: {
      listId: list1.id,
      googlePlaceId: googlePlace2.placeId,
    },
  });

  await prisma.savedPoi.create({
    data: {
      listId: list1.id,
      googlePlaceId: googlePlace3.placeId,
    },
  });

  await prisma.savedPoi.create({
    data: {
      listId: list2.id,
      poiId: poi1.id,
    },
  });

  await prisma.savedPoi.create({
    data: {
      listId: list2.id,
      googlePlaceId: googlePlace1.placeId,
    },
  });

  // Add collaborator to list
  await prisma.listCollaborator.create({
    data: {
      listId: list1.id,
      userId: user2.id,
      role: CollaboratorRole.EDITOR,
      invitedBy: user1.id,
    },
  });

  console.log("✅ Seed completed!");
  console.log(`   - 3 users created`);
  console.log(`   - 2 POIs created`);
  console.log(`   - 3 Google Places cached`);
  console.log(`   - 2 lists created`);
  console.log(`   - 1 collaborator added`);
  console.log("");
  console.log("📧 Test accounts:");
  console.log("   theobrissiaud@icloud.com / password123");
  console.log("   alice@test.com / password123");
  console.log("   bob@test.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
