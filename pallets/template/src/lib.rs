#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;
pub mod weights;
pub use weights::*;
#[frame_support::pallet]
pub mod pallet {
    use super::*;
    use frame_support::pallet_prelude::*;
    use frame_support::sp_runtime::traits::AccountIdConversion;
    use frame_support::traits::Currency;
    use frame_system::pallet_prelude::*;
    use sp_std::vec::Vec;

    #[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default, TypeInfo, MaxEncodedLen)]
    pub struct NFT<AccountId, Balance> {
        pub owner: AccountId,
        pub metadata: BoundedVec<u8, ConstU32<256>>,
        pub is_sold: bool,
        pub price: Balance,
    }

    #[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default, TypeInfo, MaxEncodedLen)]
    pub struct Collection<AccountId> {
        pub creator: AccountId,
        pub metadata: BoundedVec<u8, ConstU32<256>>,
        pub nfts: BoundedVec<ItemId, ConstU32<256>>, // List of NFT IDs in the collection
    }

    pub type CollectionId = u32;
    pub type ItemId = u32;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        type WeightInfo: WeightInfo;
        type Currency: Currency<Self::AccountId>;
        type PalletId: Get<frame_support::PalletId>;
    }

    #[pallet::storage]
    #[pallet::getter(fn artists)]
    pub type Artists<T: Config> = StorageMap<_, Blake2_128Concat, T::AccountId, bool, ValueQuery>;

    #[pallet::storage]
    #[pallet::getter(fn collections)]
    pub type Collections<T: Config> =
        StorageMap<_, Blake2_128Concat, CollectionId, Collection<T::AccountId>, OptionQuery>;

    #[pallet::storage]
    #[pallet::getter(fn nfts)]
    pub type Nfts<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        CollectionId,
        Blake2_128Concat,
        ItemId,
        NFT<T::AccountId, <T::Currency as Currency<T::AccountId>>::Balance>,
        OptionQuery,
    >;

    #[pallet::storage]
    #[pallet::getter(fn next_item_id)]
    pub type NextItemId<T: Config> =
        StorageMap<_, Blake2_128Concat, CollectionId, ItemId, ValueQuery>;

    #[pallet::storage]
    #[pallet::getter(fn next_collection_id)]
    pub type NextCollectionId<T: Config> = StorageValue<_, CollectionId, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        ArtistRegistered(T::AccountId),
        CollectionCreated(CollectionId, T::AccountId),
        CollectionUpdated(CollectionId),
        CollectionFrozen(CollectionId),
        CollectionDeleted(CollectionId),
        NFTMinted(CollectionId, ItemId, T::AccountId),
        NFTBatchMinted(CollectionId, Vec<ItemId>, T::AccountId),
        NFTTransferred(CollectionId, ItemId, T::AccountId, T::AccountId),
        NFTBurned(CollectionId, ItemId, T::AccountId),
    }

    #[pallet::error]
    pub enum Error<T> {
        NFTNotFound,
        NotNFTOwner,
        NotRegisteredArtist,
        CollectionNotFound,
        AlreadyRegistered,
        CollectionFrozen,
        NotCollectionOwner,
        NFTAlreadySold,
        MetadataInvalid,
        PriceNotSet,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Register as an artist
        #[pallet::call_index(0)]
        #[pallet::weight(Weight::default())]
        pub fn register_artist(origin: OriginFor<T>) -> DispatchResult {
            let who = ensure_signed(origin)?;

            ensure!(
                !Artists::<T>::contains_key(&who),
                Error::<T>::AlreadyRegistered
            );

            // Define the registration fee
            let registration_fee = T::Currency::minimum_balance() * 100u32.into();

            // Ensure the artist has enough balance to pay the fee
            T::Currency::transfer(
                &who,
                &T::PalletId::get().into_account_truncating(),
                registration_fee,
                frame_support::traits::ExistenceRequirement::KeepAlive,
            )?;

            Artists::<T>::insert(&who, true);
            Self::deposit_event(Event::ArtistRegistered(who));

            Ok(())
        }

        /// Create a new collection (artist only)
        #[pallet::call_index(1)]
        #[pallet::weight(Weight::default())]
        pub fn create_collection(origin: OriginFor<T>, metadata: Vec<u8>) -> DispatchResult {
            let creator = ensure_signed(origin)?;

            ensure!(Artists::<T>::get(&creator), Error::<T>::NotRegisteredArtist);

            let bounded_metadata: BoundedVec<u8, ConstU32<256>> = metadata
                .try_into()
                .map_err(|_| Error::<T>::MetadataInvalid)?;

            let collection_id = NextCollectionId::<T>::get();

            let collection = Collection {
                creator: creator.clone(),
                metadata: bounded_metadata,
                nfts: BoundedVec::new(),
            };

            Collections::<T>::insert(collection_id, collection);
            NextCollectionId::<T>::put(collection_id.saturating_add(1));

            Self::deposit_event(Event::CollectionCreated(collection_id, creator));
            Ok(())
        }

        /// Delete collection (creator only)
        #[pallet::call_index(4)]
        #[pallet::weight(Weight::default())]
        pub fn delete_collection(
            origin: OriginFor<T>,
            collection_id: CollectionId,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            let collection =
                Collections::<T>::get(collection_id).ok_or(Error::<T>::CollectionNotFound)?;
            ensure!(collection.creator == who, Error::<T>::NotCollectionOwner);

            Collections::<T>::remove(collection_id);
            Self::deposit_event(Event::CollectionDeleted(collection_id));
            Ok(())
        }

        /// Mint a single NFT
        #[pallet::call_index(6)]
        #[pallet::weight(Weight::default())]
        pub fn create_nft(
            origin: OriginFor<T>,
            collection_id: CollectionId,
            metadata: Vec<u8>,
            price: <T::Currency as Currency<T::AccountId>>::Balance,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            ensure!(
                Collections::<T>::contains_key(collection_id),
                Error::<T>::CollectionNotFound
            );
            let bounded_metadata: BoundedVec<u8, ConstU32<256>> = metadata
                .try_into()
                .map_err(|_| Error::<T>::MetadataInvalid)?;

            let item_id = NextItemId::<T>::get(collection_id);

            let nft = NFT {
                owner: sender.clone(),
                metadata: bounded_metadata,
                is_sold: false,
                price,
            };

            // Insert the NFT into storage
            Nfts::<T>::insert(collection_id, item_id, nft.clone());

            // Verify the NFT was properly stored
            ensure!(
                Nfts::<T>::contains_key(collection_id, item_id),
                Error::<T>::NFTNotFound
            );

            // Add the NFT ID to the collection
            Collections::<T>::try_mutate(collection_id, |collection_option| -> DispatchResult {
                let collection = collection_option
                    .as_mut()
                    .ok_or(Error::<T>::CollectionNotFound)?;
                collection
                    .nfts
                    .try_push(item_id)
                    .map_err(|_| Error::<T>::CollectionNotFound)?;
                // Save the updated collection back to storage
                Collections::<T>::insert(collection_id, collection.clone());
                Ok(())
            })?;

            // Increment the next item ID
            let next_id = item_id.saturating_add(1);
            NextItemId::<T>::insert(collection_id, next_id);
            Self::deposit_event(Event::NFTMinted(collection_id, item_id, sender));
            Ok(())
        }

        /// Transfer an NFT from the caller to another account.
        #[pallet::call_index(7)]
        #[pallet::weight(Weight::default())]
        pub fn transfer_nft(
            origin: OriginFor<T>,
            collection_id: CollectionId,
            item_id: ItemId,
            to: T::AccountId,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;

            Nfts::<T>::try_mutate(collection_id, item_id, |nft_option| -> DispatchResult {
                let nft = nft_option.as_mut().ok_or(Error::<T>::NFTNotFound)?;
                ensure!(nft.owner == sender, Error::<T>::NotNFTOwner);
                nft.owner = to.clone();
                nft.is_sold = true;
                Ok(())
            })?;

            Self::deposit_event(Event::NFTTransferred(collection_id, item_id, sender, to));
            Ok(())
        }

        /// Burn an NFT (only if not sold)
        #[pallet::call_index(8)]
        #[pallet::weight(Weight::default())]
        pub fn burn_nft(
            origin: OriginFor<T>,
            collection_id: CollectionId,
            item_id: ItemId,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;

            // Check if the NFT exists and the caller is the owner
            let nft = Nfts::<T>::get(collection_id, item_id).ok_or(Error::<T>::NFTNotFound)?;
            ensure!(nft.owner == sender, Error::<T>::NotNFTOwner);
            ensure!(!nft.is_sold, Error::<T>::NFTAlreadySold);

            // Remove the NFT from storage
            Nfts::<T>::remove(collection_id, item_id);

            // Remove the NFT ID from the collection
            Collections::<T>::try_mutate(collection_id, |collection_option| -> DispatchResult {
                let collection = collection_option
                    .as_mut()
                    .ok_or(Error::<T>::CollectionNotFound)?;
                collection.nfts.retain(|&id| id != item_id);
                Ok(())
            })?;

            Self::deposit_event(Event::NFTBurned(collection_id, item_id, sender));
            Ok(())
        }

        /// Buy an NFT from its owner
        #[pallet::call_index(9)]
        #[pallet::weight(Weight::default())]
        pub fn mint_nft(
            origin: OriginFor<T>,
            collection_id: CollectionId,
            item_id: ItemId,
        ) -> DispatchResult {
            let buyer = ensure_signed(origin)?;

            // Check if the NFT exists and is not already sold
            let nft = Nfts::<T>::get(collection_id, item_id).ok_or(Error::<T>::NFTNotFound)?;
            ensure!(!nft.is_sold, Error::<T>::NFTAlreadySold);
            ensure!(nft.owner != buyer, Error::<T>::NotNFTOwner);

            // Ensure the buyer has enough balance
            let seller = nft.owner.clone();
            T::Currency::transfer(
                &buyer,
                &seller,
                nft.price,
                frame_support::traits::ExistenceRequirement::KeepAlive,
            )?;

            // Transfer ownership to the buyer
            Nfts::<T>::try_mutate(collection_id, item_id, |nft_option| -> DispatchResult {
                let nft = nft_option.as_mut().ok_or(Error::<T>::NFTNotFound)?;
                nft.owner = buyer.clone();
                nft.is_sold = true;
                Ok(())
            })?;

            Self::deposit_event(Event::NFTTransferred(collection_id, item_id, seller, buyer));
            Ok(())
        }
    }
}
